import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"
import categoryService from "./categoryService"
import fileService from "./fileService"
import searchEngineService from "./searchEngineService"
import sprintService from "./sprintService"

const service = {
    user: userService
    , post: postService
    , tag: tagService
    , category: categoryService
    , file: fileService
    , search: searchEngineService
    , sprint: sprintService
}

export default service