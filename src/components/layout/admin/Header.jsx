import Link from "next/link"
import {Box, Divider, Grid, Menu, MenuItem, TextField} from "@mui/material"
import {useRouter} from "next/router"
import {useSelector} from 'react-redux'
import IconButton from "@mui/material/IconButton"
import {useEffect, useState} from "react"
import {base64Encode} from "../../../util/base64Util"
import { getTsid } from 'tsid-ts'
import {searchObjectInit} from "../../../model/searchObject"
import CreateIcon from '@mui/icons-material/Create'
import CategoryIcon from '@mui/icons-material/Category'
import TagIcon from '@mui/icons-material/Tag'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MenuIcon from '@mui/icons-material/Menu'

export default function Header({children}) {
    const router = useRouter()
    const userState = useSelector((state) => state.user)
    const [searchText, setSearchText] = useState('')
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)


    useEffect(() => {
        if (!router.pathname.startsWith('/search')) {
            setSearchText('')
        }
    }, [router.pathname])

    const onSearchTextKeyDown = (e) => {
        if (e.key === 'Enter') {
            const condition = {
                ...searchObjectInit, ...{
                    searchCondition: {
                        keywords: [{id: getTsid().toString(), name: searchText}], logic: 'AND'
                    }
                }
            }
            router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
        }
    }
    const onChangeText = (e) => {
        setSearchText(e.target.value)
    }

    // menu
    const onClickMenuOpen = (e) => {
        setAnchorEl(e.currentTarget)
    }
    const onClickMenuItem = (event, path) => {
        setAnchorEl(null)
        if (path !== 'backdropClick') {
            router.push(path)
        }
    }

    return (<>
        <nav className="top admin-back-color">
            <div className="back">
                <Grid
                    container
                    direction="row"
                    spacing={2}
                >
                    <Grid item xs={4} sm={2}>
                        <Link href={`/admin`} legacyBehavior>
                            <a className="main-link">admin</a>
                        </Link>
                    </Grid>
                    <Grid item xs={8} sm={10} display="flex">
                        <Grid item xs={1} sm={2} md={6}>
                            <Box sx={{display: {xs: 'none', sm: 'none', md: 'block'}}}>
                                <Box flex sx={{mr: 3, display: 'inline-flex'}}>
                                    <Link href={'/admin/write'} legacyBehavior>
                                        <a className="menu-link">
                                            <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                                <CreateIcon/><span>write</span>
                                            </Box>
                                        </a>
                                    </Link>
                                </Box>
                                <Box flex sx={{mr: 3, display: 'inline-flex'}}>
                                    <Link href={'/admin/categories'} legacyBehavior>
                                        <a className="menu-link">
                                            <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                                <CategoryIcon/><span>categories</span>
                                            </Box>
                                        </a>
                                    </Link>
                                </Box>
                                <Box flex sx={{mr: 3, display: 'inline-flex'}}>
                                    <Link href={'/admin/tags'} legacyBehavior>
                                        <a className="menu-link">
                                            <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                                <TagIcon/><span>tags</span>
                                            </Box>
                                        </a>
                                    </Link>
                                </Box>
                                <Box flex sx={{display: 'inline-flex'}}>
                                    <Link href={'/admin/sprint'} legacyBehavior>
                                        <a className="menu-link">
                                            <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                                <AssessmentIcon/><span>sprint</span>
                                            </Box>
                                        </a>
                                    </Link>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={11} sm={10} md={6} display="flex"
                              alignItems="center"
                              justifyContent="flex-end">
                            <TextField label="Search" variant="standard"
                                       size="small"
                                       fullWidth={true}
                                       value={searchText}
                                       type={'search'}
                                       sx={{
                                           mr: 1, maxWidth: '400px'
                                       }}
                                       onChange={onChangeText}
                                       onKeyDown={onSearchTextKeyDown}
                            />

                            <Divider orientation="vertical" variant="middle" flexItem sx={{
                                display: {md: 'none', lg: 'none'}
                            }}/>

                            <Box sx={{
                                display: {md: 'none', lg: 'none'}
                            }}>
                                <IconButton onClick={onClickMenuOpen}>
                                    <MenuIcon/>
                                </IconButton>
                                {/*TODO: 추가해야 함   https://mui.com/material-ui/react-menu/#main-content*/}
                                <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={onClickMenuItem}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    <MenuItem onClick={(event) => onClickMenuItem(event, '/admin/write')}><CreateIcon/>write</MenuItem>
                                    <MenuItem onClick={(event) => onClickMenuItem(event, '/admin/categories')}><CategoryIcon/>categories</MenuItem>
                                    <MenuItem onClick={(event) => onClickMenuItem(event, '/admin/tags')}><TagIcon/>tags</MenuItem>
                                    <MenuItem onClick={(event) => onClickMenuItem(event, '/admin/sprint')}><AssessmentIcon/>sprint</MenuItem>
                                </Menu>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        </nav>
        <style jsx>
            {`
              .top {
                height: 4rem;
                position: fixed;
                top: 0;
                right: 0;
                left: 0;
                z-index: 1024;
              }

              .back {
                display: inline-block;
                position: relative;
                width: 100%;
                height: 100%;
                line-height: 4rem;
              }

              .menu-link {
                color: #fff;
              }

              .main-link {
                margin-left: 1rem;
                font-size: 1.25rem;
                color: #fff;
              }

              @media (min-width: 600px) {
                .top {
                  position: fixed;
                  top: 0;
                  right: 0;
                  left: 0;
                  z-index: 1024;
                }

                .back {
                  line-height: 4rem;
                }
              }
            `}
        </style>
    </>)
}