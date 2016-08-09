(function ($) {
    "use strict";
    /*
     data-taboffset="0" 偏移量 data-toolbox=".nav-tool" 工具栏 data-wrap=".nav-box" 容器
     * */
    var scroolWidth = 100;//此值会变
    var toolWidth   = 160;
    var defaults = {
        tabwrap:".nav-box", //标签页容器
        toolbox:".nav-tool",//左右移动以及关闭按钮的容器
        contentwrap:'#topnav-box',
        taboffset:0  //如果默认有打开的标签则不会自动计算,需要在此设置一个默认的偏移值
    };

    $.fn.navtab = function (option, args) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('navtab'),
                options = $.extend({}, defaults, $this.data(), typeof option == 'object' && option);
            if (!data) {
                $this.data('navtab', (data = new Navtab(this, options)));
                $this.data('taboffset',options.taboffset);
            }
            if (typeof option == 'string') {
                data[option].apply(data, [].concat(args));
            }
        })
    };


    var Navtab = function (element, options) {
        this.init(element, options);
        //绑定左右移动事件
        var tabBox = this.$element, that = this;
        //左移动标签页
        this.$toolbox.find('.lf-btn .prev').click(function () {
            var left = parseInt(tabBox.css('marginLeft'));
            var navtabOffset = parseInt(tabBox.data('taboffset')) - that.$tabwrapwidth + toolWidth;
            left = Math.abs(left);
            if (left <= navtabOffset) {
                left += scroolWidth;
                tabBox.stop();
                tabBox.animate({
                    marginLeft: -left
                });
            }
        });
        //右移动标签页
        this.$toolbox.find('.lf-btn .next').click(function () {
            var left = parseInt(tabBox.css('marginLeft'));
            if (left < 0) {
                left += scroolWidth;
                left = Math.min(left, 0);
            }
            tabBox.stop();
            tabBox.animate({
                marginLeft: left
            });
        });

        //关闭所有标签
        this.$toolbox.find('.closeall').click(function () {
            if (confirm('关闭所有标签页?')) {
                $('#topnav').navtab('removeAll');
            }
        });

    };

    Navtab.prototype = {
        constructor: Navtab,
        init: function (element, options) {
            this.options = options;
            this.$element = $(element);
            //元素
            this.$toolbox = $(options.toolbox);//操作按钮
            this.$tabwrap = $(options.tabwrap);
            this.$contentwrap = $(options.contentwrap);//内容容器div
            this.$tabwrapwidth = this.$tabwrap.width();//容器宽度
            this.bindEvent(this.$element.find("li"));
        },
        bindEvent: function (tabLi) {
            var that = this;
            var tabItem = tabLi.find("a");

            //点击tab页的事件
            tabItem.click(function (e) {
                e.preventDefault();
                $(this).tab('show');
            });
            //绑定关闭按钮
            $("<a class='close' href='#'>&times;</a>").prependTo(tabItem.filter("[closeable=true]").parent())
                .click(function (e) {
                    e.preventDefault();
                    var id = $(this).next().attr("id").replace('nav-tab_','');
                    that.removeById(id);
                });
        },
        add: function (option) {
            if (!option["id"]) {
                option["id"] = this.urlToId(option["url"]);
            }
            var tabId = "tab_" + option["id"];
            //如果对应ID的tab页已存在
            if (this.$contentwrap.find("#" + tabId).length > 0) {
                //激活对应ID的tab页
                $('#nav-' + tabId).tab('show');
                return;
            }
            var closeable = option["closeable"] !== false;

            var tabLi = $("<li><a id='nav-" + tabId + "' href='#" + tabId + "'" + (closeable ? "closeable='true'" : "") + " >" + option["title"] + "</a></li>").appendTo(this.$element);
            this.bindEvent(tabLi);
            var content = option["content"];//直接html
            if (option["url"]) {
                content = '<iframe src="' + option["url"] + '" id="iframe_' + option["id"] + '" width="100%" height="100%" scrolling="auto" frameborder="0" marginwidth="0" marginheight="0" style="overflow: hidden;"></iframe>';
            }
            this.$contentwrap.append("<div class='tab-pane fade' id='" + tabId + "'>" + content + "</div>");
            tabLi.find("a").not(".close").tab('show');

            //添加成功后回调
            option.callback && option.callback.call(this, tabLi,content);
            //计算宽度
            var _tabOffset = parseInt(this.$element.data('taboffset'));
            var tabOffset = _tabOffset + tabLi.width() + 2;//2是margin
            scroolWidth   = tabLi.width() > scroolWidth ? tabLi.width() : scroolWidth;
            scroolWidth   = Math.min(scroolWidth,this.$tabwrapwidth);//避免有奇葩一个标签就超过整个页面宽度
            this.$element.data('taboffset', tabOffset);
            if ((tabOffset + toolWidth) > this.$tabwrapwidth) { //toolWidth是操作栏的宽度
                this.$toolbox.find('.lf-btn').show();
                //自动滚动
                this.$toolbox.find('.lf-btn .prev').click();
            }
        },
        removeById: function (id) {
            var tabId = "tab_" + id,
                tabItem = $('#nav-' + tabId),
                width = tabItem.parent().width();
            //处理taboffset
            var _tabOffset = parseInt(this.$element.data('taboffset'));
            var tabOffset = (_tabOffset - width) > 0 ? (_tabOffset - width) : 0;
            //隐藏左右移动按钮
            if ((tabOffset+scroolWidth) < this.$tabwrapwidth) {
                this.$toolbox.find('.lf-btn').hide();
                //滚动到最左边
                this.$element.css('marginLeft',0);
            } else {
                var marginLeft = Math.abs(parseInt(this.$element.css('marginLeft')));
                this.$element.css('marginLeft',-(marginLeft - width));
            }
            this.$element.data('taboffset', tabOffset);
            //删除tab内容
            $("#" + tabId).remove();
            //如果本tab已被激活，激活前一个tab页
            if (tabItem.parent().is(".active")) {
                tabItem.parent().prev().find("a").not(".close").tab('show');
            }
            //删除tab页
            tabItem.parent().remove();
            this.$tabwrap.css('marginLeft',0);
        },
        removeAll: function () {
            var that = this;
            this.$element.find('li').each(function () {
                var li = $(this);
                var a = li.find('a:eq(1)');
                var closeable = a.attr('closeable');
                if (closeable || closeable == 'true') {
                    var id = a.attr('id').replace('nav-tab_', '');
                    that.removeById(id);
                }
            });
        },
        /**
         * 没有指定ID时直接使用url作为ID
         * @param url
         * @returns {string|XML|*}
         */
        urlToId: function (url) {
            url = url.replace('http://', '');
            url = url.replace(/\//g, '_');
            url = url.replace('?', '_');
            url = url.replace(/&/g, '_');
            url = url.replace(/=/g, '');
            url = url.replace('#', '');
            url = url.replace('.', '_');
            return url;
        }
    };

    $.fn.navtab.Constructor = Navtab;
})(window.jQuery);