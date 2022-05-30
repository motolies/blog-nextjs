import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"
import categoryService from "./categoryService"
import fileService from "./fileService"
import searchEngineService from "./searchEngineService"

const service = {
    user: userService
    , post: postService
    , tag: tagService
    , category: categoryService
    , file: fileService
    , search: searchEngineService
}

export default service