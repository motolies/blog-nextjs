import test from 'node:test'
import assert from 'node:assert/strict'

import {
    CIDR_TABLE,
    ipToLong,
    isIpInCidr,
    isValidIpv4,
    longToIp,
    parseCidr,
    rangeToCidrBlocks,
    splitSubnet
} from '../../src/util/cidrUtils.ts'

test('IPv4 validator rejects malformed octets and octal-looking values', () => {
    assert.ok(isValidIpv4('0.0.0.0'))
    assert.ok(isValidIpv4('255.255.255.255'))
    assert.ok(!isValidIpv4('256.1.1.1'))
    assert.ok(!isValidIpv4('192.168.1'))
    assert.ok(!isValidIpv4('192.168.01.1'))
    assert.ok(!isValidIpv4(''))
})

test('IP long conversion round-trips across the whole address space', () => {
    assert.equal(ipToLong('0.0.0.0'), 0)
    assert.equal(ipToLong('255.255.255.255'), 4294967295)
    assert.equal(ipToLong('192.168.0.1'), 3232235521)
    assert.equal(longToIp(0), '0.0.0.0')
    assert.equal(longToIp(4294967295), '255.255.255.255')
    assert.equal(longToIp(ipToLong('172.31.255.255')), '172.31.255.255')
    assert.throws(() => longToIp(4294967296))
})

test('CIDR parser reports range, netmask and address count', () => {
    const {info, error} = parseCidr('172.16.0.0/12')

    assert.equal(error, null)
    assert.equal(info.networkAddress, '172.16.0.0')
    assert.equal(info.broadcastAddress, '172.31.255.255')
    assert.equal(info.netmask, '255.240.0.0')
    assert.equal(info.wildcardMask, '0.15.255.255')
    assert.equal(info.totalAddresses, 1048576)
    assert.equal(info.usableHosts, 1048574)
    assert.equal(info.firstHost, '172.16.0.1')
    assert.equal(info.lastHost, '172.31.255.254')
    assert.equal(info.isPrivate, true)
})

test('CIDR parser handles /0, /31 and /32 boundaries', () => {
    const all = parseCidr('0.0.0.0/0').info
    assert.equal(all.netmask, '0.0.0.0')
    assert.equal(all.wildcardMask, '255.255.255.255')
    assert.equal(all.totalAddresses, 4294967296)
    assert.equal(all.broadcastAddress, '255.255.255.255')

    const pointToPoint = parseCidr('10.0.0.0/31').info
    assert.equal(pointToPoint.usableHosts, 2)
    assert.equal(pointToPoint.firstHost, '10.0.0.0')
    assert.equal(pointToPoint.lastHost, '10.0.0.1')

    const single = parseCidr('10.0.0.7/32').info
    assert.equal(single.usableHosts, 1)
    assert.equal(single.networkAddress, '10.0.0.7')
    assert.equal(single.broadcastAddress, '10.0.0.7')
})

test('CIDR parser normalizes host addresses to the network address', () => {
    assert.equal(parseCidr('10.0.0.5/8').info.cidr, '10.0.0.0/8')
    assert.equal(parseCidr('192.168.1.200/26').info.cidr, '192.168.1.192/26')
    assert.equal(parseCidr('192.168.1.7').info.cidr, '192.168.1.7/32')
})

test('CIDR parser returns errors for invalid input', () => {
    assert.ok(parseCidr('256.1.1.1/24').error)
    assert.ok(parseCidr('10.0.0.0/33').error)
    assert.ok(parseCidr('10.0.0.0/').error)
    assert.ok(parseCidr('').error)
    assert.equal(parseCidr('10.0.0.0/8').error, null)
})

test('Range to CIDR decomposition covers the range exactly', () => {
    const {blocks, error} = rangeToCidrBlocks('192.168.1.5', '192.168.1.20')

    assert.equal(error, null)
    assert.deepEqual(blocks.map((block) => block.cidr), [
        '192.168.1.5/32',
        '192.168.1.6/31',
        '192.168.1.8/29',
        '192.168.1.16/30',
        '192.168.1.20/32'
    ])
    assert.equal(blocks.reduce((sum, block) => sum + block.totalAddresses, 0), 16)
    assert.equal(blocks[0].startLong, ipToLong('192.168.1.5'))
    assert.equal(blocks[blocks.length - 1].endLong, ipToLong('192.168.1.20'))
})

test('Range to CIDR collapses the full address space into a single block', () => {
    const {blocks} = rangeToCidrBlocks('0.0.0.0', '255.255.255.255')

    assert.deepEqual(blocks.map((block) => block.cidr), ['0.0.0.0/0'])
})

test('Range to CIDR validates ordering and format', () => {
    assert.ok(rangeToCidrBlocks('192.168.1.20', '192.168.1.5').error)
    assert.ok(rangeToCidrBlocks('192.168.1.300', '192.168.1.5').error)
    assert.ok(rangeToCidrBlocks('192.168.1.5', '').error)

    const single = rangeToCidrBlocks('10.1.1.1', '10.1.1.1')
    assert.equal(single.error, null)
    assert.deepEqual(single.blocks.map((block) => block.cidr), ['10.1.1.1/32'])
})

test('Subnet split enumerates evenly divided blocks', () => {
    const {subnets, totalCount, truncated, error} = splitSubnet('192.168.0.0/24', 26)

    assert.equal(error, null)
    assert.equal(totalCount, 4)
    assert.equal(truncated, false)
    assert.deepEqual(subnets.map((subnet) => subnet.cidr), [
        '192.168.0.0/26',
        '192.168.0.64/26',
        '192.168.0.128/26',
        '192.168.0.192/26'
    ])
    assert.equal(subnets[0].firstHost, '192.168.0.1')
    assert.equal(subnets[0].lastHost, '192.168.0.62')
    assert.equal(subnets[0].usableHosts, 62)
})

test('Subnet split truncates large results and reports the real total', () => {
    const {subnets, totalCount, truncated, error} = splitSubnet('192.168.0.0/24', 32)

    assert.equal(error, null)
    assert.equal(totalCount, 256)
    assert.equal(truncated, false)
    assert.equal(subnets.length, 256)

    const limited = splitSubnet('10.0.0.0/8', 32, 10)
    assert.equal(limited.totalCount, 16777216)
    assert.equal(limited.subnets.length, 10)
    assert.equal(limited.truncated, true)
})

test('Subnet split rejects a prefix shorter than the source prefix', () => {
    assert.ok(splitSubnet('192.168.0.0/24', 16).error)
    assert.ok(splitSubnet('192.168.0.0/24', 40).error)
    assert.equal(splitSubnet('192.168.0.0/24', 24).subnets.length, 1)
})

test('IP containment check resolves membership and surfaces errors', () => {
    assert.equal(isIpInCidr('10.5.4.3', '10.0.0.0/8').contained, true)
    assert.equal(isIpInCidr('11.0.0.1', '10.0.0.0/8').contained, false)
    assert.equal(isIpInCidr('172.31.255.255', '172.16.0.0/12').contained, true)
    assert.equal(isIpInCidr('172.32.0.0', '172.16.0.0/12').contained, false)

    const invalidIp = isIpInCidr('999.1.1.1', '10.0.0.0/8')
    assert.equal(invalidIp.contained, null)
    assert.ok(invalidIp.error)

    const invalidCidr = isIpInCidr('10.0.0.1', '10.0.0.0/44')
    assert.equal(invalidCidr.contained, null)
    assert.ok(invalidCidr.error)
})

test('CIDR reference table spans every prefix with consistent values', () => {
    assert.equal(CIDR_TABLE.length, 33)
    assert.equal(CIDR_TABLE[0].netmask, '0.0.0.0')
    assert.equal(CIDR_TABLE[24].netmask, '255.255.255.0')
    assert.equal(CIDR_TABLE[24].usableHosts, 254)
    assert.equal(CIDR_TABLE[32].netmask, '255.255.255.255')
    assert.equal(CIDR_TABLE[32].usableHosts, 1)
    assert.ok(CIDR_TABLE.every((row, index) => row.prefix === index))
})
