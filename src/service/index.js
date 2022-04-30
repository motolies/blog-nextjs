import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"
import categoryService from "./categoryService"

const service = {
    user: userService
    , post: postService
    , tag: tagService
    , category: categoryService
}

export default service