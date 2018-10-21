import MultiLevelPopPicker from '../../src/index.js'
fetch('./dist/data.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    console.log(myJson);

             var city_picker = new MultiLevelPopPicker({
                    panelTitle: '自定义标题',
                    layer: 3,
                    titleWidthLayer: [20, 20, 45],
                    defaultTitles: ['省份', '城市', '请选择']
                });
                city_picker.setData(myJson.d);
                
                document.getElementById('pop').onclick = function (ev) {
                    city_picker.show(function (items) {
                        var result=items.map(function (a) {
                            return a.text
                        }).join(' ');
                        // console.log(result);
                    });
                };
                document.getElementById('pop').click();
  });