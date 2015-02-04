/*
 * snailfwd-parser-component
 */
'use strict';
module.exports = function(content, file, conf){
//    fis.util.merge(_.templateSettings, conf);
//    return _.template(content).source;

    var componentLabels=content.match(componentLabelReg('**')),
        requireLabels=content.match(requireLabelReg('**')),
        mainJs,
        components=[],
        requires=[];

    if(file.rExt=='.html'&&componentLabels){
        mainJs=parseTplMainJs(content,file);
    }

    if(componentLabels){
        for(var i=0;i<componentLabels.length;i++){
            var componentLabel=componentLabels[i];//<!--component("menu")-->
            components.push(parseComponentName(componentLabel));
        }
        file.requireComponents=components;
        if(mainJs){
            file.mainJs=mainJs;
        }
        file.componentsReg=componentLabelReg;
    }
    if(file.rExt!='.js'&&requireLabels){
        //fis 系统默认会去检测js的require情况，所以就不再处理了，以免重复
        for(var i=0;i<requireLabels.length;i++){
            var requireLabel=requireLabels[i];//<!--component("menu")-->
            requires.push(parseComponentName(requireLabel));
        }
        file.requires=file.requires.concat(requires);
    }

    function componentLabelReg(name){
        switch (name){
            case '**':
                name='(.)*';
                break;
        }
        return new RegExp('<!--load\\(("|\')('+name+')("|\')\\)-->','g');
    }
    function requireLabelReg(name){
        switch (name){
            case '**':
                name='(.)*';
                break;
        }
        return new RegExp('require\\(("|\')('+name+')("|\')\\)','g');
    }
    function parseComponentName(str){
        if(/\"/g.test(str)){
            return str.split('\"')[1];
        }else if(/\'/g.test(str)){
            return str.split('\'')[1];
        }
    }
    function parseTplMainJs(content,file){
        /*
         * 分析带有data-main属性的标签，如：<script type="text/javascript" data-main='true' src="static/index/index.js"></script>
         * 如果该标签里有src则返回src，如果没有则返回‘self’
         * */
        var dataMainScript=content.match(/\<script[^\<\>]*data-main(.)*\>(.)*\<\/script\>/g);

        if(dataMainScript){
            dataMainScript=content.match(/\<script[^\<\>]*data-main(.)*\>(.)*\<\/script\>/g)[0];
            if(/src/g.test(dataMainScript)){
                //如果有src属性，说明是从外部文件引用，找到该文件，进行__COMPONENT_INIT__替换
                var src=normalizeSrc(parseSrc(dataMainScript.match(/src=(\'|\")(.)*(\'|\")/g)[0]));
                //可能是相对路径，也可能是绝对路径，根据目前目录结构规范，可以简单的将相对路径的..去掉即可得到绝对路径，todo
                src=src.replace(/\.\./g,'');

                return src;
            }else{
                //没有src属性，该标签内，可能有__COMPONENT_INIT__，进行替换
                return 'self';
            }
        }else{
            console.log(file.id+' has not data-main js!');
            return false;
        }
        function parseSrc(src){
            if(/\"/g.test(src)){
                return src.split("\"")[1];
            }else{
                return src.split("\'")[1];
            }
        }
        function normalizeSrc(src){
            //去掉src路径开头的绝对相对路径符号
            return src.replace(/^(\.\/|\/)/g,'');
        }
    }
    return content;
};
