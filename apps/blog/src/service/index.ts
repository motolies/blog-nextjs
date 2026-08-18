import categoryService from './categoryService';
import favoriteService from './favoriteService';
import fileService from './fileService';
import hotDealService from './hotDealService';
import logService from './logService';
import masterCodeService from './masterCodeService';
import memoService from './memoService';
import postService from './postService';
import searchEngineService from './searchEngineService';
import seriesService from './seriesService';
import tagService from './tagService';
import userService from './userService';

const service = {
  user: userService,
  post: postService,
  tag: tagService,
  category: categoryService,
  file: fileService,
  search: searchEngineService,
  favorite: favoriteService,
  memo: memoService,
  log: logService,
  masterCode: masterCodeService,
  hotDeal: hotDealService,
  series: seriesService,
};

export default service;
