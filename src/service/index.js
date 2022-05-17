import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"
import categoryService from "./categoryService"
import fileService from "./fileService"

const service = {
    user: userService
    , post: postService
    , tag: tagService
    , category: categoryService
    , file: fileService
}

export default service