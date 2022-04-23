// https://stackoverflow.com/questions/66832985/cant-return-axios-all-data-from-getserversideprops
export async function getServerSideProps(ctx) {
    const profileDataReq = axios({
        method: 'GET',
        url: 'http://localhost:8000/api/auth/profile/',
        headers: { cookie: ctx.req.headers.cookie }
    });
    const bookmarksReq = axios({
        method: 'GET',
        url: 'http://localhost:8000/api/blogs/saved/',
        headers: { cookie: ctx.req.headers.cookie }
    });
    const [profile, bookmarks] = await Promise.all([
        profileDataReq,
        bookmarksReq
    ]);

    return {
        props: {
            profile: profile.data,
            bookmarks: bookmarks.data
        }
    };
};