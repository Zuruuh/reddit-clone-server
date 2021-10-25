export const buildSqlJson = (builder: string, fields: string[]): string => {
  return fields
    .map((field, index) => {
      return `'${field}', 
      ${builder}."${field}"${fields.length - 1 === index ? "" : ","}`;
    })
    .join("");
};
