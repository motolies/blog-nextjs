import axiosClient from "../../lib/axiosClient";
import {Box, Button, Checkbox, FormControlLabel, Grid, TextField} from "@mui/material";
import Link from "next/link";
import forge from 'node-forge'

async function encPassword(pass) {
    try {
        const {resPublicKey, mEncPass} = await axiosClient.post('/api/auth/shake')
            .then(res => {
                const resPublicKey = res.data.rsaKey
                const publicKey = forge.pki.publicKeyFromPem('-----BEGIN PUBLIC KEY----- ' + resPublicKey + ' -----END PUBLIC KEY-----')
                const encData = publicKey.encrypt(pass, 'RSA-OAEP', {
                    md: forge.md.sha256.create(),
                    mgf1: {
                        md: forge.md.sha1.create()
                    }
                })
                const mEncPass = forge.util.encode64(encData)
                return {resPublicKey, mEncPass}
            });
        return {resPublicKey, mEncPass}
    } catch (err) {
        return err
    }
};

export default function login() {

    // 로그인 기능을 사용해보자
    const handleSubmit = async (event) => {
        // 로그인 시작 & 서브밋 요청이 가기전에 해제한다.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const {resPublicKey, mEncPass} = await encPassword(event.target.password.value)

        const loginReq = {
            username: data.get('username'),
            password: mEncPass,
            rsaKey: resPublicKey
        }

        axiosClient.post(`/api/auth/login`, loginReq)
            .then(res => {
                if (res.data.token !== undefined) {
                    // TODO : redux로 관리해야함, 우선은 쿠키로 받아옴
                    window.location.href = '/'
                } else {
                    alert(res.data.message)
                }
            })
            .catch(err => {
                alert(err)
            })

    };

    return (
        <>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="UserName"
                    name="username"
                    autoComplete="email"
                    autoFocus
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{mt: 3, mb: 2}}
                >
                    Login
                </Button>
            </Box>
        </>
    )
}
//
// export async function getServerSideProps(context) {
//     try {
//         const key = await axiosClient.post('/api/auth/shake')
//             .then(res => res.data)
//         return {
//             props: {rsaKey: key.rsaKey}
//         }
//     } catch (error) {
//         console.log(error.response.status)
//         console.log(error)
//         return {
//             props: {error}
//         }
//     }
// }