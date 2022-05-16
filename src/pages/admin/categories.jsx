import CategoryTreeView from "../../components/CategoryTreeView"
import {Box, Grid,} from "@mui/material"


export default function CategoriesPage() {


    return (
        <>
            <h1>categories</h1>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={7} elevation={3}>
                    <Box sx={{
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        height: {xs: '60vh', sm: '60vh', md: 'auto'},
                    }}>
                        <CategoryTreeView/>
                    </Box>

                </Grid>
                <Grid item xs={12} sm={12} md={5}
                      sx={{
                          position: {xs: 'static', sm: 'static', md: 'sticky'},
                          top: {xs: 0, sm: 0, md: '4rem'},
                          height: '400px'
                      }}>
                    <h3>#상태창</h3>
                    좌우로 있을 때는 sticky
                    모바일로 보일 때는 treeview의 height를 조정하고 밑으로 붙는다.
                </Grid>
            </Grid>
        </>
    )
}