import { FilterQuery, Query } from "mongoose";

export interface QueryObj {
  sort?: string;
  fields?: string;
  limit?: string;
  page?: string;
}

class APIFeatures {
  query: Query<any, any, any>;
  queryObj: QueryObj;
  constructor(query: Query<any, any, any>, queryObj: QueryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }
  filter() {
    var { page, sort, limit, fields, ...restQuery } = this.queryObj;
    var queryStr = JSON.stringify(restQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|search|text)\b/g, (match) => `$${match}`);
    var queryParsed: FilterQuery<any> = JSON.parse(queryStr);
    this.query = this.query.find(queryParsed);
    return this;
  }
  sort() {
    if (this.queryObj.sort) {
      var sortBy = this.queryObj.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }
  limitFields() {
    if (this.queryObj.fields) {
      var fields = this.queryObj.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    var page = parseInt(this.queryObj?.page!) || 1;
    var limit = parseInt(this.queryObj?.limit!) || 10;
    var skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
  get() {
    return this.query;
  }
}
export default APIFeatures;
