import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"
import categoryService from "./categoryService"
import fileService from "./fileService"
import searchEngineService from "./searchEngineService"
import sprintService from "./sprintService"
import favoriteService from "./favoriteService"
import memoService from "./memoService"
import logService from "./logService"
import masterCodeService from "./masterCodeService"

const service = {
    user: userService
    , post: postService
    , tag: tagService
    , category: categoryService
    , file: fileService
    , search: searchEngineService
    , sprint: sprintService
    , favorite: favoriteService
    , memo: memoService
    , log: logService
    , masterCode: masterCodeService
}

export default service
