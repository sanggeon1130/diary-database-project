var template = {
    html:function(title, list, body, control, authStatusUI){
      return `
      <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
  ${authStatusUI}
    <h1><a href="/">WEB</a></h1>
    ${list}
    ${control}
    <h3>${title}</h3>
    ${body}
    </p>
  </body>
  </html>

      `;
    },
    list:function(diaries){
      var list = "<ul>"
      var i = 0;
      while(i < diaries.length){
        list = list + `<li><a href = "/topic/${diaries[i].id}">${diaries[i].title}</a></li>`
        i = i + 1;
      }
      list = list + "</ul>"
      return list;
    }
  }
  module.exports = template;