import userService from "./userService"
import postService from "./postService"
import tagService from "./tagService"

const service = {
    user: userService
    , post: postService
    ,tag: tagService
}

export default service