/**
 * Created by lkl on 2016/8/12.
 * 加载背景图片
 * 加载微信头像
 * 加载微信昵称
 * 加载我的烟豆
 * 加载赚取烟豆
 *
 */

var BG_Object = null;
var PlayerType = null;
var G_BackGroundLayer = cc.Layer.extend({
    sprite:null,
    _Avatar : null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();
        BG_Object = this;
        var self = this;
        this.WinSize = cc.winSize;
        this.my_win_bean = 0;

        cc.eventManager.addCustomListener(cc.game.EVENT_HIDE, function(){
            cc.log("游戏进入后台");
        });
        cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, function(){
            cc.log("重新返回游戏");
        });

        //把自己的信息传到nodejs
        socket.emit('login', {openid:wx_info.openid, headimgurl:wx_info.imgUrl, total_gold:wx_info.total_gold, nickname:wx_info.nickname });
        socket.on('enter', function(obj) {
            cc.log(obj);
            room_id = obj.room_id;
            PlayerType = obj.playerType;
            cc.log(PlayerType);
        });

        //接收
        socket.on('sendOther', function(obj) {
            cc.log(obj);
            if(obj.openid != wx_info.openid){
                self.changeOtherPlayer(obj);
            }

        });

        //接收另一个人的信息
        socket.on('sendMyself', function(obj) {
            self.changeOtherPlayer(obj);
        });

        //加载背景图片
        this.initBackGround();
        //加载微信头像、微信昵称、我的烟豆、赚取烟豆
        this.initHeader();

        var otherObj = {headimgurl:'null.png', nickname:'', total_gold:''};
        this.initPlayerHeader(otherObj);

        return true;
    },

    //加载背景图片
    initBackGround : function() {
        this._bg = new cc.Sprite(res.S_bg);
        this._bg.attr({
            x:this.WinSize.width/2,
            y:this.WinSize.height/2
        });
        this._bg.setRotation(90);
        this.addChild(this._bg);

    },

    //加载自己的微信头像、微信昵称、我的烟豆、赚取烟豆
    initHeader : function() {
        /*this._Header_bg = new cc.DrawNode();
        var ltp = cc.p(0, this.WinSize.height);
        var rbp = cc.p(this.WinSize.height, this.WinSize.height - 80);
        this._Header_bg.drawRect(ltp, rbp, cc.color(233,158,57));
        this.addChild(this._Header_bg);*/

        var self = this;
        //加载微信头像到背景图的某个位置
        cc.loader.loadImg(wx_info.imgUrl, {isCrossOrigin : false }, function(err, img)
        {
            self._Avatar = new cc.Sprite(img);
            //设置精灵（图片）的锚点
            self._Avatar.attr({
                anchorX : 0.5,
                anchorY : 0.5
            });
            self._Avatar.setPosition(this._Avatar.width/2+16,this.WinSize.height-this._Avatar.height/2-16);  //设置微信头像的位置
            self._Avatar.setRotation(90);
            self.addChild(self._Avatar);

        }.bind(this));


        //微信昵称
        this._NickName_label = new cc.LabelTTF(wx_info.nickname,'Arial',20);
        this._NickName_label.attr({
            anchorX : 0,
            anchorY : 0.5
        });
        this._NickName_label.setPosition(80,830);
        this._NickName_label.setRotation(90);
        this.addChild(this._NickName_label);

        //我的烟豆
        this._mybean = new cc.LabelTTF(wx_info.total_gold,'Arial',20);
        this._mybean.attr({
            anchorX : 0,
            anchorY : 0.5
        });
        this._mybean.setPosition(31,780);
        this._mybean.setRotation(90);
        this.addChild(this._mybean);
        //总共赚取烟豆
        /*this._mywinbean = new cc.LabelTTF('本次赚取：'+this.my_win_bean,'Arial',14);
        this._mywinbean.attr({
            anchorX : 0,
            anchorY : 0.5
        });
        this._mywinbean.setPosition(70,10);
        this._mywinbean.setRotation(90);
        this.addChild(this._mywinbean);*/

    },

    //加载对手玩家微信头像、微信昵称、我的烟豆、赚取烟豆
    initPlayerHeader : function(obj) {
        var self = this;
        //加载微信头像到背景图的某个位置
        cc.loader.loadImg(obj.imgUrl, {isCrossOrigin : false }, function(err, img)
        {
            self.headsprite = new cc.Sprite(img);
            self.headsprite.x = this.WinSize.width-self.headsprite.width/2;
            self.headsprite.y = this.WinSize.height-250;
            self.headsprite.setAnchorPoint(0.5, 0.5);
            self.headsprite.setRotation(90);
            self.addChild(self.headsprite, 21);
        }.bind(this));

        var my_info_font_size = 24;
        //昵称
        this.nickname2 = new cc.LabelTTF('昵称：'+obj.nickname, font_type, 22, cc.size(140,22));
        this.nickname2.x = this.WinSize.width-120;
        this.nickname2.y = this.WinSize.height-190;
        this.nickname2.setAnchorPoint(0,0.5);
        this.nickname2.setColor(cc.color(0, 250, 154));
        this.nickname2.setRotation(90);
        this.addChild(this.nickname2, 10);

        //龙币数
        this.scoreLabel2 = new cc.LabelTTF(obj.total_gold.toString(), "Arial", my_info_font_size);
        this.scoreLabel2.x = this.WinSize.width-45;
        this.scoreLabel2.y = this.WinSize.height-30;
        this.scoreLabel2.value = obj.total_gold,
        this.scoreLabel2.setAnchorPoint(0,1);
        this.scoreLabel2.setRotation(90);
        this.addChild(this.scoreLabel2, 5);

    },

    changeOtherPlayer:function(obj){
        var self = this;
        cc.loader.loadImg(obj.headimgurl, {isCrossOrigin : false }, function(err, img) {
            self.removeChild(self.headsprite);
            self.headsprite = new cc.Sprite(img);
            self.headsprite.x = this.WinSize.width-self.headsprite.width/2;
            self.headsprite.y = this.WinSize.height-250;
            self.headsprite.setAnchorPoint(0.5, 0.5);
            self.headsprite.setRotation(90);
            self.addChild(self.headsprite, 21);
        }.bind(this));

        this.nickname2.setString(obj.nickname);
        this.scoreLabel2.setString(obj.total_gold);

    }


});

