/**
 * Created by lkl on 2016/8/12.
 */

var G_ThouchLayer = cc.Layer.extend({
    sprite: null,
    curr_selected_OBJ: null,//当前选中的押号按钮
    curr_bet_obj: null,//当前选中的下注按钮
    bet_on_obj: null,   //存放押注对象
    my_YD: null,//我的烟豆(与数据库同步)
    UI_YD: null,//UI显示的烟豆数
    show_xz: null,    //游戏底部下注数组
    poker_value:null,//玩家背景牌精灵
    poker_value2:null,//庄家背景牌精灵
    player_num:null,//玩家、庄家的牌数（从后台异步获取）
    bgmusic_flag:null,
    MusicSet:null,
    EffectsSet:null,

    ctor: function () {
        // 1. super init first
        this._super();
        this.WinSize = cc.winSize;  //获取当前游戏窗口大小
        this.my_YD = wx_info.total_gold;
        this.UI_YD = wx_info.total_gold;
        this.MusicSet = wx_info.MusicSet;
        this.EffectsSet = wx_info.EffectsSet;
        var self = this;
        cc.spriteFrameCache.addSpriteFrames(res.s_card_plist);
        cc.log("游戏类型为："+PlayerType);

        //接收下注信息
        socket.on('updatescroce', function(obj) {
            if(obj.openid!=wx_info.openid){
                self.changeOtherXz(obj);
            }
        });

        socket.on('get_player_ready', function(obj) {
            if(obj.openid!=wx_info.openid){
                if(obj.player_ready==1){
                    self._start_menu.setVisible(true);
                    self.bet_on_obj.total = obj.score;
                }
            }
        });

        //接收结果和具体牌面
        socket.on('otherPlayerGetPoker', function(obj) {
            if(obj.openid!=wx_info.openid){
                self.showOtherPoker(obj);
            }
        });


        //喇叭公告
        setXlbText(this);
        this.schedule(function noting() {
                setXlbText(self);
            }, 20
        );

        this.initBgMusicBtn();//设置喇叭播放按钮位置

        this.initBgMusicStopBtn();//设置喇叭禁止播放按钮位置

        this.initBgMusic(); //播放背景音乐

        this.initBetOnObj();//初始化押注值：0

        this.initBetArea();//设置投注值位置（10 20 50 100）

        this.initChipsArea(); //设置已押注的图标（点击下注前，隐藏）

        this.initXzArea();//设置下注数值

        this.initStartArea();//设置开始按钮位置（点击下注前，隐藏）

        this.initShowDownArea();//设置摊牌按钮位置（点击下注前，隐藏）

        this.initReadyArea();//设置准备按钮位置，点击之后可以重新下注（点击下注前，隐藏）

        this.initPlayerReadyBtn();//玩家准备按钮，下好注之后，点击该按钮，发送一个信号给庄家，庄家接收到准备就绪信号后，生成开始发牌按钮

        this.initOtherXzArea();//设置对方的下注值位置

        this.initPlayAgainBtn();//再玩一局按钮

        this.schedule(this.chooseBaker, 1 ,10, 1);    //定时函数，每1秒执行一次chooseBaker函数

        return true;
    },

    //玩家准备按钮
    initPlayerReadyBtn:function(){
        this.s_btn_PlayerreadyArea = new cc.MenuItemImage(res.s_ok_btn,res.s_ok_btn,this.PlayerReadyCallback,this);
        this.s_btn_PlayerreadyArea.attr({
            x:310,
            y:480
        });
        this.s_btn_PlayerreadyArea.setRotation(90);
        this._Playerready_menu = new cc.Menu(this.s_btn_PlayerreadyArea);
        this._Playerready_menu.x=0;
        this._Playerready_menu.y=0;
        this.addChild(this._Playerready_menu);
        this._Playerready_menu.setVisible(false);
    },

    PlayerReadyCallback:function(){
        xhr.open("POST", base_url + "&m=send_player_ready");
        xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                var httpStatus = xhr.statusText;
                var responseObj = {sum: 0, game_id: 0, status: 0};
                responseObj = eval('(' + xhr.responseText + ')');
                socket.emit('send_player_ready', {score:responseObj.score, openid:wx_info.openid, key:responseObj.key,player_ready:responseObj.player_ready });
            }
        };
        var data = this.postData2(this.bet_on_obj.total);//转换格式
        xhr.send(data);
        this._Playerready_menu.setVisible(false);
    },

    //选择谁是庄家
    chooseBaker:function(){
        if(PlayerType!=null){
            if(PlayerType=="player2"){
                //是庄家
                this._bet_menu.setVisible(false);
            }
            this.unschedule(this.chooseBaker);
        }
    },

    //播放背景音乐
    initBgMusic: function () {
        if(this.MusicSet){
            cc.audioEngine.playMusic(res.s_bg_music,true);
            this._s_horn_menu.setVisible(true);
        }else{
            cc.audioEngine.stopMusic();
            this._s_hornStop_menu.setVisible(true);
        }

    },

    initBgMusicBtn: function () {
        this.s_hornArea = new cc.MenuItemImage(res.s_horn,res.s_horn,this.BgMusicCallback,this);
        this.s_hornArea.attr({
            x:480,
            y:860
        });
        this.s_hornArea.setRotation(90);
        this._s_horn_menu = new cc.Menu(this.s_hornArea);
        this._s_horn_menu.x=0;
        this._s_horn_menu.y=0;
        this.addChild(this._s_horn_menu);
        this._s_horn_menu.setVisible(false);
    },

    initBgMusicStopBtn: function () {
        this.s_hornStopArea = new cc.MenuItemImage(res.s_stop_horn,res.s_stop_horn,this.BgMusicCallback,this);
        this.s_hornStopArea.attr({
            x:480,
            y:860
        });
        this.s_hornStopArea.setRotation(90);
        this._s_hornStop_menu = new cc.Menu(this.s_hornStopArea);
        this._s_hornStop_menu.x=0;
        this._s_hornStop_menu.y=0;
        this.addChild(this._s_hornStop_menu);
        this._s_hornStop_menu.setVisible(false);
    },

    BgMusicCallback: function(){
        if(this.MusicSet){
            cc.audioEngine.stopMusic();
            this._s_hornStop_menu.setVisible(true);
            this._s_horn_menu.setVisible(false);
            this.MusicSet = 0;
        }else{
            cc.audioEngine.playMusic(res.s_bg_music,true);
            this._s_hornStop_menu.setVisible(false);
            this._s_horn_menu.setVisible(true);
            this.MusicSet = 1;
        }

        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("POST", "index.php?c=poker&m=set_music");
        //set Content-type "text/plain;charset=UTF-8" to post plain text
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status <= 207) {
                    var response = eval("("+xhr.responseText+")");//接收服务器返回结果
                    if(response.Code == 0){
                        //cc.log(response.MusicSet);
                    }else{
                        alert(response.Msg);
                    }
                }else {
                    var tipUI = new TipUI("网络故障，请稍后再试试~");
                    this.addChild(tipUI,100);
                }
            }
        };
        xhr.send("MusicSet="+this.MusicSet+"&Openid="+wx_info.openid);//发送下注信息到服务器

    },

    //初始化押注值：0
    initBetOnObj: function () {
        this.bet_on_obj = {'total': 0};
    },

    //设置投注值位置（10 20 50 100）
    initBetArea: function () {
        var PositionX = 58;

        this._bet_5 = new cc.MenuItemImage(res.s_bet5,res.s_bet5, this.betCallBack, this);
        this._bet_5.attr({
            x: PositionX,
            y: 510,
            bet_num: 5
        });
        this._bet_5.setRotation(90);

        this._bet_10 = new cc.MenuItemImage(res.s_bet10,res.s_bet10, this.betCallBack, this);
        this._bet_10.attr({
            x: PositionX,
            y: 400,
            bet_num: 10
        });
        this._bet_10.setRotation(90);

        this._bet_20 = new cc.MenuItemImage(res.s_bet20,res.s_bet20, this.betCallBack, this);
        this._bet_20.attr({
            x: PositionX,
            y: 300,
            bet_num: 20
        });
        this._bet_20.setRotation(90);

        this._bet_50 = new cc.MenuItemImage(res.s_bet50,res.s_bet50, this.betCallBack, this);
        this._bet_50.attr({
            x: PositionX,
            y: 190,
            bet_num: 50
        });
        this._bet_50.setRotation(90);

        this._bet_100 = new cc.MenuItemImage(res.s_bet100,res.s_bet100, this.betCallBack, this);
        this._bet_100.attr({
            x: PositionX,
            y: 80,
            bet_num: 100
        });
        this._bet_100.setRotation(90);

        this._bet_menu = new cc.Menu(this._bet_5,this._bet_10,this._bet_20,this._bet_50,this._bet_100);
        this._bet_menu.attr({
            x: 0,
            y: 0
        });
        this.addChild(this._bet_menu);

    },
    //投注之后回调函数：依次累加每次投注的值
    betCallBack: function (sender){
        var effect_ya = cc.audioEngine.playEffect(res.s_ya,false);
        cc.log(this.bet_on_obj.total);
        if(this.checkYD(this.bet_on_obj.total+sender.bet_num)){
            this.show_xz.setVisible(true);
            this._Playerready_menu.setVisible(true);
            this.s_chipsArea.setVisible(true);
            this.bet_on_obj.total += sender.bet_num;    //累加每次投注的值
            this.show_xz.setString(this.bet_on_obj.total); //设置文本框中的文本
            this.UI_YD -= sender.bet_num;
            BG_Object._mybean.setString(this.UI_YD); //设置文本框中的文本

            xhr.open("POST", base_url + "&m=save_result");
            xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded;charset=UTF-8");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                    var httpStatus = xhr.statusText;
                    var responseObj = {sum: 0, game_id: 0, status: 0};
                    responseObj = eval('(' + xhr.responseText + ')');
                    socket.emit('savescroce', {score:responseObj.score, openid:wx_info.openid, key:responseObj.key });
                }
            };
            var data = this.postData2(this.bet_on_obj.total);//转换格式
            xhr.send(data);
        }else{
            var tipUI = new TipUI("龙币不足！");
            this.addChild(tipUI,100);
        }
    },

    //已押注的图标
    initChipsArea: function(){
        this.s_chipsArea = new cc.Sprite(res.s_chips);
        this.s_chipsArea.attr({
            x:this.s_chipsArea.height/2+113,
            y:this.WinSize.height-this.s_chipsArea.width/2-16
        });
        this.s_chipsArea.setRotation(90);
        this.addChild(this.s_chipsArea);
        this.s_chipsArea.setVisible(false);
    },

    //总的押注数值
    initXzArea:function(){
        var fontColor = new cc.Color(255, 255, 0);  //实列化颜色对象
        this.show_xz = new cc.LabelTTF('0', 'Arial', 20);
        this.show_xz.attr({
            x: 127,
            y: 146,
            anchorX: 0.5,
            anchorY: 0.5
        });
        this.show_xz.setRotation(90);
        this.show_xz.setColor(fontColor);
        this.addChild(this.show_xz);
        this.show_xz.setVisible(false);
    },

    //“开始发牌”按钮
    initStartArea:function(){
        this.s_btn_startArea = new cc.MenuItemImage(res.s_btn_start,res.s_btn_start,this.beginCallback,this);
        this.s_btn_startArea.attr({
            x:250,
            y:500
        });
        this.s_btn_startArea.setRotation(90);
        this._start_menu = new cc.Menu(this.s_btn_startArea);
        this._start_menu.x=0;
        this._start_menu.y=0;
        this.addChild(this._start_menu);
        this._start_menu.setVisible(false);
    },

    initPlayAgainBtn:function(){
        this.s_play_again = new cc.MenuItemImage(res.s_play_again,res.s_play_again,this.PlayAgainCallback,this);
        this.s_play_again.attr({
            x:310,
            y:480
        });
        this.s_play_again.setRotation(90);
        this._s_play_again_menu = new cc.Menu(this.s_play_again);
        this._s_play_again_menu.x=0;
        this._s_play_again_menu.y=0;
        this.addChild(this._s_play_again_menu);
        this._s_play_again_menu.setVisible(false);
    },

    PlayAgainCallback:function(){
        this._s_play_again_menu.setVisible(false);
        this.poker_value.setVisible(false);
        this.poker_value2.setVisible(false);
        this._s_show_down_menu.setVisible(false);
        this.bet_on_obj.total = 0;
    },

    //准备按钮
    initReadyArea:function(){
        this.s_btn_readyArea = new cc.MenuItemImage(res.s_btn_ready,res.s_btn_ready,this.readyCallback,this);
        this.s_btn_readyArea.attr({
            x:310,
            y:480
        });
        this.s_btn_readyArea.setRotation(90);
        this._ready_menu = new cc.Menu(this.s_btn_readyArea);
        this._ready_menu.x=0;
        this._ready_menu.y=0;
        this.addChild(this._ready_menu);
        this._ready_menu.setVisible(false);
    },

    //点击“准备”按钮后的回调函数：隐藏当前显示的扑克、准备按钮、摊牌按钮；显示投注框、投注的值
    readyCallback:function(){
        this.poker_value.setVisible(false);
        this.poker_value2.setVisible(false);
        this._bet_menu.setVisible(true);
        this._ready_menu.setVisible(false);
        this._s_show_down_menu.setVisible(false);
        //上一盘的下注值清零
        this.bet_on_obj.total = 0;
        //BG_Object._mywinbean.setString('本次赚取：' + 0);
    },

    //“摊牌”
    initShowDownArea:function(){
        this.s_show_downArea = new cc.MenuItemImage(res.s_btn_show,res.s_btn_show,this.resultCallback,this);
        this.s_show_downArea.attr({
            x:175,
            y:210
        });
        this.s_show_downArea.setRotation(90);
        this._s_show_down_menu = new cc.Menu(this.s_show_downArea);
        this._s_show_down_menu.x=0;
        this._s_show_down_menu.y=0;
        this.addChild(this._s_show_down_menu);
        this._s_show_down_menu.setVisible(false);
    },

    //发牌动作
    beginCallback:function(){
        var effect_send = cc.audioEngine.playEffect(res.s_send,false);
        var self=this;
        //异步
        xhr.open("POST", "index.php?c=poker&m=main");
        //set Content-type "text/plain;charset=UTF-8" to post plain text
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status <= 207) {
                    var response = eval("("+xhr.responseText+")");//接收服务器返回结果
                    self.player_num =response ; //玩家、庄家的牌数赋值给全景变量
                    //将结果和具体牌面发给对手
                    socket.emit('sendPokerNum', {score:response.bets,winner:response.winner, openid:wx_info.openid, p_1:response.p_1,p_2:response.p_2, b_1:response.b_1,b_2:response.b_2,key:response.key});
                    if(response.Code == 0){
                        //给闲家发背面牌
                        self.resultAreaHide();
                        self.poker_value  = new cc.Sprite(res.s_bg_poker);
                        self.poker_value.attr({
                            x:self.WinSize.width/2,
                            y:265
                        });
                        self.poker_value.setRotation(92);
                        self.addChild( self.poker_value );
                        var action1 = cc.moveTo(0.5,cc.p(185, self.WinSize.height/2));
                        var callback = cc.callFunc(self.showCallBack,self);
                        var sequence = cc.sequence(action1,callback);
                        self.poker_value.runAction(sequence);
                        self.s_show_downArea.setVisible(true);
                        //玩家翻牌
                        self.scheduleOnce(function(){
                            var b1 = self.player_num.b_1;
                            var b2 = self.player_num.b_2;
                            var player_poker = new cc.Sprite('#'+b1+'_'+b2+'.png');
                            player_poker.attr({
                                x : self.poker_value.width/2,
                                y : self.poker_value.height/2
                            });
                            self.poker_value.addChild(player_poker);
                            self.resultAreaShow();//显示“翻牌”按钮
                        },0.5);

                    }else{
                        alert(response.Msg);
                    }
                }else {
                    alert('网络故障，请稍后再试试~');
                }
            }
        };
        var params = "openid="+wx_info.openid+"&gamekey="+wx_info.gamekey+"&bet_num="+this.bet_on_obj.total+"&otherplayeropenid="+OtherPlayerOpenid;
        xhr.send(params);//发送下注信息到服务器

    },

    //放置一张扑克牌（正面）隐藏
    showCallBack:function(node){
        //给庄家发背面牌
        cc.log("给对手发牌");
        this.poker_value2  = new cc.Sprite(res.s_bg_poker);
        this.poker_value2.attr({
            x:this.WinSize.width/2,
            y:265
        });
        this.poker_value2.setScale(0.6,0.6);//设置精灵的缩放比例
        this.poker_value2.setRotation(90);
        this.addChild( this.poker_value2 );
        var action2 = cc.moveTo(0.5,cc.p(400, this.WinSize.height/2));
        //var action3 = cc.scaleTo(1,0.6);
        var sequence2 = cc.sequence(action2);
        this.poker_value2.runAction(sequence2);
    },

    //点击“摊牌”按钮后的回调函数：摊开庄家的底牌。。。
    resultCallback:function(){
        var p1 = this.player_num.p_1;
        var p2 = this.player_num.p_2;
        var baker_poker = new cc.Sprite('#'+p1+'_'+p2+'.png');
        baker_poker.attr({
           x :  this.poker_value2.width/2,
           y :  this.poker_value2.height/2
        });
        this.poker_value2.addChild(baker_poker);
        //判断谁赢
        if(this.player_num.winner=='baker'){
            var effect_player_win = cc.audioEngine.playEffect(res.s_player_win,false);
            this.playerWin();
        }else{
            var effect_baker_win = cc.audioEngine.playEffect(res.s_baker_win,false);
            this.bankerWin();
        }
        this.s_show_downArea.setVisible(false);
    },

    //闲家赢的动画
    playerWin:function(){
        //押注图标从庄家移动到闲家
        this.playerChips  = new cc.Sprite(res.s_chips);
        this.playerChips.attr({
            x:450,
            y:300
        });
        this.playerChips.setRotation(90);
        this.addChild( this.playerChips );
        var action1 = cc.moveTo(1,cc.p(this.playerChips.height/2+113, this.WinSize.height-this.playerChips.width/2-16));
        var callback1 = cc.callFunc(this.playerAdd,this);   //龙币加
        var action2 = cc.fadeOut(0.5);
        var callback2 = cc.callFunc(this.playerFadeOut,this);
        var sequence = cc.sequence(action1,callback1,action2,callback2);
        this.playerChips.runAction(sequence);
    },

    playerAdd:function(node){
        cc.log("总下注值"+this.bet_on_obj.total);
        cc.log("总下注值"+this.player_num.bets);
        cc.log("庄家"+this.player_num.My_YD);
        this.show_xz.setString(this.bet_on_obj.total+this.player_num.bets); //设置文本框中的文本
        this.my_YD = this.player_num.My_YD;   //更新我的龙币值
        this.UI_YD = this.player_num.My_YD;   //更新我的龙币值
        BG_Object._mybean.setString(this.my_YD);  //显示最新的龙币值
        BG_Object.scoreLabel2.setString(this.Other_YD);  //显示对方最新的龙币值
        cc.log("最后剩余："+BG_Object._mybean);
        //BG_Object._mywinbean.setString('本次赚取：' + this.bet_on_obj.total);//显示本次赚取的龙币
    },

    playerFadeOut:function(node){
        this.s_chipsArea.setVisible(false);
        this.show_xz.setVisible(false);
        this._s_play_again_menu.setVisible(true);
    },


    //庄家赢的动画
    bankerWin:function(){
        //押注图标从闲家移动到庄家
        this.playerChipsTemp  = new cc.Sprite(res.s_chips);
        this.playerChipsTemp.attr({
            x:this.playerChipsTemp.height/2+113,
            y:this.WinSize.height-this.playerChipsTemp.width/2-16
        });
        this.playerChipsTemp.setScale(0.5,0.5);
        this.playerChipsTemp.setRotation(90);
        this.addChild( this.playerChipsTemp );

        var callback1 = cc.callFunc(this.bakerFadeOut,this);
        var action1 = cc.moveTo(1,cc.p(450, 300));
        var callback2 = cc.callFunc(this.bakerFadeOut2,this);
        var action2 = cc.fadeOut(1);
        var sequence = cc.sequence(callback1,action1,callback2,action2);
        this.playerChipsTemp.runAction(sequence);
    },

    bakerFadeOut:function(){
        cc.log("更新龙币");
        this.s_chipsArea.setVisible(false);
        this.show_xz.setVisible(false);
        this.my_YD = this.player_num.My_YD;   //更新我的龙币值
        this.UI_YD = this.player_num.My_YD;   //更新我的龙币值
        BG_Object._mybean.setString(this.my_YD);  //显示最新的龙币值
        BG_Object.scoreLabel2.setString(this.Other_YD);  //显示对方最新的龙币值
        //BG_Object._mywinbean.setString('本次赚取：-' + this.bet_on_obj.total);
    },

    bakerFadeOut2:function(){
        this._s_play_again_menu.setVisible(true);
    },

    //显示结果
    resultAreaShow : function() {
        this._s_show_down_menu.setVisible(true);
    },

    //隐藏结果
    resultAreaHide : function() {
        //发牌前，先隐藏“开始”按钮，“下注”按钮
        this._start_menu.setVisible(false);
        this._bet_menu.setVisible(false);
    },

    //判断是否有充足的烟豆下注
    checkYD: function (bet_num) {
        if (!bet_num) {
            return false;
        }
        //判断，若用户烟豆>=下注的总数
        if (this.my_YD >= bet_num) {
            return true;
        }else{
            return false;
        }

    },

    postData: function (data) {
        //  var data = {data:'我是你'};
        var params = "openid="+wx_info.openid+"&gamekey="+wx_info.gamekey+"&bet_num="+data;
        return params;
    },

    postData2: function(data){
        var params = "openid="+wx_info.openid+"&gamekey="+wx_info.gamekey+"&score="+data;
        return params;
    },

    //播放音效
    playEffect : function() {
        if(AllowMusic){
            cc.audioEngine.playEffect(res.s_yao,true);
        }
    },

    //对方总的押注数值
    initOtherXzArea:function(){
        var fontColor = new cc.Color(255, 255, 0);  //实列化颜色对象
        this.other_show_xz = new cc.LabelTTF('0', 'Arial', 20);
        this.other_show_xz.attr({
            x: this.WinSize.width-90,
            y: this.WinSize.height-30,
            anchorX: 0.5,
            anchorY: 0.5
        });
        this.other_show_xz.setRotation(90);
        this.other_show_xz.setColor(fontColor);
        this.addChild(this.other_show_xz);
    },

    changeOtherXz:function(obj){
        cc.log(obj.score);
        var value = Number(obj.score);
        this.other_show_xz.setString( value );
    },

    showOtherPoker:function(obj){
        //给庄家发背景牌
        cc.log("给自己发牌");
        this.player_num = obj;
        var self = this;
        self.resultAreaHide();
        self.poker_value  = new cc.Sprite(res.s_bg_poker);
        self.poker_value.attr({
            x:self.WinSize.width/2,
            y:265
        });
        self.poker_value.setRotation(92);
        self.addChild( self.poker_value );
        var action1 = cc.moveTo(0.5,cc.p(185, self.WinSize.height/2));
        var callback = cc.callFunc(self.showCallBack,self);
        var sequence = cc.sequence(action1,callback);
        self.poker_value.runAction(sequence);
        //self.s_show_downArea.setVisible(true);
        //庄家翻牌
        self.scheduleOnce(function(){
            var p1 = obj.p_1;
            var p2 = obj.p_2;
            var player_poker = new cc.Sprite('#'+p1+'_'+p2+'.png');
            player_poker.attr({
                x : self.poker_value.width/2,
                y : self.poker_value.height/2
            });
            self.poker_value.addChild(player_poker);
            self.initShowOtherDownArea();
        },0.5);

        cc.log("发牌结束");
    },

    //“摊牌”
    initShowOtherDownArea:function(){
        this.s_other_show_downArea = new cc.MenuItemImage(res.s_btn_show,res.s_btn_show,this.resultOtherCallback,this);
        this.s_other_show_downArea.attr({
            x:175,
            y:210
        });
        this.s_other_show_downArea.setRotation(90);
        this._s_other_show_down_menu = new cc.Menu(this.s_other_show_downArea);
        this._s_other_show_down_menu.x=0;
        this._s_other_show_down_menu.y=0;
        this.addChild(this._s_other_show_down_menu);
    },

    //点击“摊牌”按钮后的回调函数：摊开庄家的底牌。。。
    resultOtherCallback:function(){
        var b1 = this.player_num.b_1;
        var b2 = this.player_num.b_2;
        var baker_poker = new cc.Sprite('#'+b1+'_'+b2+'.png');
        baker_poker.attr({
            x :  this.poker_value2.width/2,
            y :  this.poker_value2.height/2
        });
        this.poker_value2.addChild(baker_poker);
        //判断谁赢
        if(this.player_num.winner=='baker'){
            var effect_baker_win = cc.audioEngine.playEffect(res.s_baker_win,false);
            this.otherbankerWin();
        }else{
            var effect_player_win = cc.audioEngine.playEffect(res.s_player_win,false);
            this.otherplayerWin();
        }
        this.s_show_downArea.setVisible(false);
    },

    otherplayerWin:function(){
        //押注图标从庄家移动到闲家
        this.playerChips  = new cc.Sprite(res.s_chips);
        this.playerChips.attr({
            x:450,
            y:300
        });
        this.playerChips.setRotation(90);
        this.addChild( this.playerChips );
        var action1 = cc.moveTo(1,cc.p(this.playerChips.height/2+113, this.WinSize.height-this.playerChips.width/2-16));
        var callback1 = cc.callFunc(this.playerAdd2,this);
        var action2 = cc.fadeOut(0.5);
        var callback2 = cc.callFunc(this.otherplayerFadeOut,this);
        var sequence = cc.sequence(action1,callback1,action2,callback2);
        this.playerChips.runAction(sequence);
    },

    playerAdd2:function(){
        this.show_xz.setString(this.my_YD+this.player_num.score); //设置文本框中的文本
        this.my_YD = this.my_YD+this.player_num.score;   //更新我的龙币值
        this.UI_YD = this.my_YD+this.player_num.score;   //更新我的龙币值
        BG_Object._mybean.setString(this.my_YD);  //显示最新的龙币值
    },

    otherplayerFadeOut:function(){
        this.s_chipsArea.setVisible(false);
        this.show_xz.setVisible(false);
        this._ready_menu.setVisible(true);
    },


    otherbankerWin:function(){
        //押注图标从闲家移动到庄家
        this.playerChipsTemp  = new cc.Sprite(res.s_chips);
        this.playerChipsTemp.attr({
            x:this.playerChipsTemp.height/2+113,
            y:this.WinSize.height-this.playerChipsTemp.width/2-16
        });
        this.playerChipsTemp.setScale(0.5,0.5);
        this.playerChipsTemp.setRotation(90);
        this.addChild( this.playerChipsTemp );

        var callback1 = cc.callFunc(this.otherbakerFadeOut,this);
        var action1 = cc.moveTo(1,cc.p(450, 300));
        var callback2 = cc.callFunc(this.otherbakerFadeOut2,this);
        var action2 = cc.fadeOut(1);
        var sequence = cc.sequence(callback1,action1,callback2,action2);
        this.playerChipsTemp.runAction(sequence);
    },

    otherbakerFadeOut:function(){
        cc.log("玩家更新-当前下注值1-异步："+this.bet_on_obj.total);
        cc.log("玩家更新-当前下注值2-异步："+this.player_num.score);
        cc.log("玩家更新-当前龙币-异步："+this.my_YD);
        cc.log("玩家更新-最后剩余龙币-异步："+this.my_YD-this.player_num.score);
        this.s_chipsArea.setVisible(false);
        this.show_xz.setVisible(false);
        this.my_YD = this.my_YD-this.player_num.score;   //更新我的龙币值
        this.UI_YD = this.my_YD-this.player_num.score;   //更新我的龙币值
        BG_Object._mybean.setString(this.my_YD);  //显示最新的龙币值
    },

    otherbakerFadeOut2:function(){
        this._ready_menu.setVisible(true);
    }

});


