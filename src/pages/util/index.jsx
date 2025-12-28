import {Box, Card, CardActionArea, CardContent, Typography, Grid} from '@mui/material'
import {useRouter} from 'next/router'
import TransformIcon from '@mui/icons-material/Transform'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption'
import ScheduleIcon from '@mui/icons-material/Schedule'

const utilities = [
    {
        id: 'tsid',
        title: 'TSID Converter',
        description: 'TSID 생성 및 변환 도구. TSID와 숫자, 날짜/시간 간 변환 기능을 제공합니다.',
        icon: <TransformIcon sx={{fontSize: 40, color: 'primary.main'}}/>,
        path: '/util/tsid'
    },
    {
        id: 'mermaid',
        title: 'Mermaid Editor',
        description: '실시간 Mermaid 다이어그램 에디터. 차트를 편집하고 이미지로 내보낼 수 있습니다.',
        icon: <AccountTreeIcon sx={{fontSize: 40, color: 'primary.main'}}/>,
        path: '/util/mermaid'
    },
    {
        id: 'barcode',
        title: 'Barcode Generator',
        description: '1D 바코드(CODE128, EAN 등)와 QR 코드를 생성하고 이미지로 다운로드할 수 있습니다.',
        icon: <QrCode2Icon sx={{fontSize: 40, color: 'primary.main'}}/>,
        path: '/util/barcode'
    },
    {
        id: 'encode',
        title: 'Encoder / Decoder',
        description: 'Base64, URL, HTML, Unicode, 해시(MD5/SHA256), JWT, JSON 등 다양한 인코딩/디코딩 도구입니다.',
        icon: <EnhancedEncryptionIcon sx={{fontSize: 40, color: 'primary.main'}}/>,
        path: '/util/encode'
    },
    {
        id: 'crontab',
        title: 'Crontab Calculator',
        description: 'Unix crontab과 Spring Scheduler cron 표현식을 분석하고 다음 실행 시간을 계산합니다.',
        icon: <ScheduleIcon sx={{fontSize: 40, color: 'primary.main'}}/>,
        path: '/util/crontab'
    }
]

export default function UtilIndexPage() {
    const router = useRouter()

    return (
        <Box sx={{p: 2}}>
            <Typography variant="h4" gutterBottom sx={{fontWeight: 'bold', mb: 3}}>
                유틸리티
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{mb: 4}}>
                개발에 유용한 도구 모음입니다.
            </Typography>
            <Grid container spacing={3}>
                {utilities.map((util) => (
                    <Grid item xs={12} sm={6} md={4} key={util.id}>
                        <Card
                            elevation={2}
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => router.push(util.path)}
                                sx={{height: '100%', p: 1}}
                            >
                                <CardContent>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                        {util.icon}
                                        <Typography variant="h6" sx={{ml: 2, fontWeight: 'medium'}}>
                                            {util.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {util.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )
}
