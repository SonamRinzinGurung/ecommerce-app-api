const Product = require("../models/product");

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;
  const queryObject = {};
  if (featured) {
    queryObject.featured = featured === "true" ? true : false;
  }
  if (company) {
    queryObject.company = company;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  if (numericFilters) {
    //initially query will look like this : price>40
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g; //regular expression that finds the operators

    //replace the operators in the query with the mapped operator that mongoose understands using the replace method
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    //now query will look like this: price-$gt-40

    //settings field options that can use the numeric filter feature
    const options = ["price", "rating"];

    //splitting each field filter that are comma separated and looping over them
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-"); //splitting the fields into three variables

      //in console--> field = 'price' ; operator = '$gt' and value = '40'

      //if the field is allowed
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) }; //set a new query object with fields that have to properties ; operator and value
      }
      //queryObject in console ---> {price:{'$gt':40}}
    });
  }

  let result = Product.find(queryObject);

  //sort
  if (sort) {
    const sortList = sort.split(",").join(" ");
    console.log(sortList);
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  //select fields
  if (fields) {
    const fieldList = fields.split(",").join(" ");
    console.log(fieldList);
    result = result.select(fieldList);
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);
  const products = await result;
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
  getAllProducts,
};
