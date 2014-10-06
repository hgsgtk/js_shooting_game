"use strict"
/*javascriptを書くときの最初のおまじない*/

//全体で使用する変数を定義
var canvas, ctx;

//FPS管理に使用するパラメーターを定義
var FPS = 30;
var MSPF = 1000/FPS;

//キー状態管理変数の定義（確か256以上のキーコードはないと）
var KEYS = new Array(256);
//キーの状態をfalse（押されていない）で初期化
for(var i=0; i<KEYS.length; i++){
	KEYS[i] - false;
}

//発射インターバルの値を定義（この値が大きいほど連射が遅くなる）
var FIRE_INTERVAL = 20;
//無敵インターバルの値を定義（この値が大きいほど連射が長くなる）
var STAR_INTERVAL = 20;
//弾の数を定義（同時に描画される弾の最大化より大きい必要あり）
var BULLETS = 5;
//敵キャラの数を定義
var ENEMIES = 10;
//プレイヤー画像を保持する変数を定義
var img_player;
//プレイヤーの弾画像を保持する変数を定義
var img_player_bullet;
//敵キャラ画像を保持する変数を定義
var img_enemy;
//プレイヤーの現在位置を保持する変数を定義(x座標,y座標)
var player_x, player_y;
//プレイヤーの弾の現在位置（配列）を保持する変数を定義しBULLETSだけ要素数を持つ配列を代入
var player_bullet_x = new Array(BULLETS);
var player_bullet_y = new Array(BULLETS);
//配列をそれぞれ用意
var enemies_x = new Array(ENEMIES);
var enemies_y = new Array(ENEMIES);
//プレイヤーのヒットポイント
var player_hp;
//敵キャラのヒットポイント（配列）を保持する変数を定義しENEMIES分だけ要素数を持つ配列を代入
var enemies_hp = new Array(ENEMIES);
//プレイヤーの発射インターバル
var player_fire_interval = 0;
//プレイヤーの無敵インターバル
var player_star_interval = 0;
//弾のヒットポイント（配列）を保持する変数を定義しBULLET分だけ要素数を持つ配列を代入
var player_bullets_hp = new Array(BULLETS);
//いちょう定義するがまだ未解決
var killed = 0;
//タイトルループを定義
var titleloop_blinker = 0;
var titleloop = function(){
	//処理開始時間を保存
	var startTime = new Date();

	//キャンパスをクリアする
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	//lineで装飾
	//参考：http://www.html5.jp/canvas/ref/method/lineTo.html
	ctx.strokeStyle = '#fff';
	ctx.beginPath();
	ctx.moveTo(20, 100);
	ctx.lineTo(canvas.width - 20, 100);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(20, 145);
	ctx.lineTo(canvas.width - 20, 100);
	ctx.stroke();
	ctx.strokeStyle = '#444';
	ctx.beginPath();
	ctx.moveTo(30, 90);
	ctx.lineTo(canvas.width - 30, 155);
	ctx.stroke();

	var text, width;
	//javascript shootingと表示
	ctx.font = '20px sans-serif';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#fff';
	text = "Javascript Shooting";
	width = ctx.measureText(text).width;
	ctx.fillText(text,
				(canvas.width - width) / 2,
				120);

	//Hit SPACE to Startと表示
	titleloop_blinker++;
	if(titleloop_blinker > 20){
		//点滅処理に透過度を調整
		ctx.globalAlpha = 0.5;
		//30をこえていたら0に戻す
		if(titleloop_blinker > 30){
			titleloop_blinker = 0;
		}
	}

	ctx.font = '12px sans-serif';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#ddd';
	text = "Hit SPACE to Start";
	width = ctx.measureText(text).width;
	ctx.fillText(text, (canvas.width - width) / 2, 240);
	ctx.globalAlpha = 1.0;
	ctx.restore();


	//スペースが押されていた場合はmainloopを呼び出して、titleloopを終了
	var SPACE = 32;
	if(KEYS[SPACE]){
		//メインループを呼び出す
		mainloop();
		//継続処理をせずに関数を終了(titleloopを抜ける)
		return;
	}

	//処理経過時間および次のループまでの間隔を計算
	var deltaTime = (new Date()) - startTime;
	var interval = MSPF - deltaTime;
	if(interval > 0){
		//処理が早すぎるので次のループまで少し待つ
		//titleloop()を直接呼び出すとフリーズします。
		setTimeout(titleloop, interval);
	}else{
		//処理が遅すぎるので即時のループを実行する
		setTimeout(titleloop, 0);
	}
};



//再描画する関数
var redraw = function(){
	//キャンバスクリア
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//生きている場合だけ新しい位置にプレイヤーを描写
	if(player_hp > 0){
		//透過度を変えるのでコンテキストの状態を保存
		ctx.save();
		//無敵時間の状態に応じて描画の透明度を変更
		if(player_star_interval % 2 != 0){
			//半透明に描画する
			ctx.globalAlpha = 0.5;
		}
		ctx.drawImage(img_player, player_x, player_y);
		//コンテキストの状態を戻す
		ctx.restore();
	}
	
	//弾の画像を(bullet_x[i], bullet_y[i])の位置に表示
	for(var i=0; i<BULLETS; i++){
		//生きている場合のみ描画
		if(player_bullets_hp[i] > 0){
			ctx.drawImage(img_player_bullet, player_bullet_x[i], player_bullet_y[i]);
		}
	}

	//敵キャラの画像を(enemies_x,y[i])の位置に表示
	for(var i=0; i<ENEMIES; i++){
		if(enemies_hp[i] > 0){
		ctx.drawImage(img_enemy, enemies_x[i], enemies_y[i]);
		}
	}

	//コンテキストの状態を保存(fillstyleを変えたりする)
	ctx.save();
	//HPの最大値(10)*5の短形を描写（白）
	ctx.fillstyle = '#fff';
	ctx.fillRect(10, canvas.height - 10, 10 * 5, 5);
	//残りHP×５の短形を描写（赤）
	ctx.fillStyle = '#f00';
	ctx.fillRect(10, canvas.height - 10, player_hp*5, 5);

	//「倒した敵の数/全敵の数」という文字列を作成
	var text = "killed: " + killed + "/" + ENEMIES;
	//文字列の（描画）横幅を計算する
	var width = ctx.measureText(text).width;
	//文字列を描写（白）
	ctx.fillstyle = '#fff';
	ctx.fillText(text,
				canvas.width - 10 - width,
				canvas.height - 10);

	if(player_hp <= 0){
		//全体を半透明の黒い四角で覆う（オーバーレイ）
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1.0;

		//真ん中に大きな文字でゲームオーバー（赤）と表示する
		ctx.font = '20px sans-serif';
		ctx.textBaseline = 'middle'; //上下位置のベースラインを中心に
		ctx.fillStyle = '#f00';
		text = "Game Over";
		width = ctx.measureText(text).width;
		ctx.fillText(text,
					(canvas.width - width) / 2,
					canvas.height / 2);
	}

	//敵が殲滅していた場合はゲームクリア画面を表示
	else if(killed == ENEMIES){
		//全体を半透明の黒い◆で覆う（オーバーレイ）
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1.0;

		//真ん中に大きな文字でゲームクリア（白）と表示する
		ctx.font = '20px sans-serif';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#fff';
		text = "Game Clear";
		width = ctx.measureText(text).width;
		ctx.fillText(text,
					(canvas.width - width) / 2,
					canvas.height / 2);
	}

	//コンテキストの状態を復元
	ctx.restore();	
};

//プレイヤーの移動処理を定義
var movePlayer = function(){
	//ヒットポイントを確認し、生きている場合のみ処理をする
	if(player_hp <= 0){
		return;
	}

	//上下左右の移動速度を定義
	var SPEED = 2;

	//キー番号を変数に変換する
	var RIGHT = 39;
	var LEFT = 37;
	var SPACE = 32;

	if(KEYS[RIGHT] && player_x + img_player.width < canvas.width){
		//プレイヤーのx座標を少し増やす
		player_x += SPEED;
	}
	if(KEYS[LEFT] && player_x > 0){
		//ぷれいやーのx座標をスコス減らす
		player_x -= SPEED;
	}

	//スペースが押され、なおかつ発射インターバルが0の時だけ発射する
	if(KEYS[SPACE]){
		//未使用な弾があれば発射する
		for(var i=0; i<BULLETS; i++){
			if(player_bullets_hp[i] == 0){
				//弾の初期位置はプレイヤーと同じ位置にする
				player_bullet_x[i] = player_x;
				player_bullet_y[i] = player_y;
				//弾のHPを１とする。これにより次のループから描写や移動処理を行われるようにする。
				player_bullets_hp[i] = 1;
				//弾は打ったのでループは抜ける。ループ処理を途中でやめる場合は'break'を使う
				player_fire_interval = FIRE_INTERVAL;
				break;
			}
		}
	}

	//発射インタ―バルの値が0より大きい場合は値を減らす
	if(player_fire_interval > 0){
		player_fire_interval--;
	}
	//プレイヤーがはみ出てしまった場合は強制的に中に戻す
	if(player_x < 0){
		player_x = 0;
	}else if(player_x + img_player.width > canvas.width){
		player_x = canvas.width - img_player.width;
	}
};


//プレイヤーの弾の移動処理を定義
var movePlayerBullets = function(){
	//上下左右の移動速度を定義
	var SPEED = -6;

	//各段ごとに処理をおこなう
	for(var i=0; i<BULLETS; i++){
		//ヒットポイントを確認し、生きている場合のみ処理をする
		if(player_bullets_hp[i] <= 0){
			continue;
		}

		//弾のy座標を少し増やす（減らす）
		player_bullet_y[i] += SPEED;

		//弾が上画面にはみ出した場合はHPを0にして未使用状態に戻す
		if(player_bullet_y[i] < img_player_bullet.height){
			player_bullets_hp[i] = 0;
		}
	}
}




//敵キャラの移動処理を定義
var moveEnemies = function(){
	//上下左右の移動速度を定義
	var SPEED = 2;

	//各敵キャラごとに処理を行う
	for(var i=0; i<ENEMIES; i++){
		//ヒットポイントを確認し、生きている場合のみ処理する
		if(enemies_hp[i] <= 0){
			continue;
		}

		//敵キャラのy座標をスコスずらす
		enemies_y[i] += SPEED;

		//敵キャラが下画面にはみ出した場合は上に戻す
		if(enemies_y[i] > canvas.height){
			enemies_y[i] = -img_enemy.height;
			//x座標はランダムに
			enemies_x[i] = Math.random() * (canvas.width - img_enemy.width);			
		}
	}
};


//汎用的当たり判定回数
var hitCheck = function(x1, y1, obj1, x2, y2, obj2){
	var cx1, cy1, cx2, cy2, r1, r2, d;
	//中心座標の取得
	cx1 = x1 + obj1.width/2;
	cy1 = y1 + obj1.height/2;
	cx2 = x2 + obj2.width/2;
	cy2 = y2 + obj2.height/2;
	//半径計算
	r1 = (obj1.width + obj1.height)/4;
	r2 = (obj2.width + obj2.height)/4;
	//中心座標同士の距離の測定
	/*Math.sqrt(d) : dのルートを返す
	　　Math.pow(x, a) : xのa乗を返す
	*/
	d = Math.sqrt(Math.pow(cx1 - cx2, 2) + Math.pow(cy1 - cy2, 2));
	//あたっているか判定
	if(r1 + r2 > d){
		//あたっている
		return true;
	}else{
		//あたっていない
		return false;
	}
};


//メインループの定義
var mainloop = function(){
	//処理開始時間を保存
	var startTime = new Date();

	//プレイヤーの移動処理
	movePlayer();
	//敵キャラの移動処理
	moveEnemies();
	//プレイヤーの弾の移動処理
	movePlayerBullets();

	//プレイヤーと敵キャラの当たり判定
	if(player_hp > 0){
		for(var i=0; i<ENEMIES; i++){
			//敵が生きている場合のみ判定する
			if(enemies_hp[i] > 0){
				if(hitCheck(player_x, player_y, img_player, enemies_x[i], enemies_y[i], img_enemy)){
					//あたっているのでお互いのHPを1削る
					player_hp -= 1;
					enemies_hp[i] -= 1;

					//プレイヤーを無敵状態にする
					player_star_interval = STAR_INTERVAL;
				}
			}
		}
	}

	//プレイヤーの無敵インターバルを減少させる
	if(player_star_interval > 0){
		player_star_interval--;
	}

	//プレイヤー弾と敵キャラの当たり判定（プレイヤーが生きている場合）
	if(player_hp > 0){
		for(var i=0; i<ENEMIES; i++){
			//敵が死んでいる場合はスルーする
			if(enemies_hp[i] <= 0){
				continue;
			}
			for(var j=0; j<BULLETS; j++){
				//弾が死んでいる場合はスルーする
				if(player_bullets_hp[j] <= 0){
					continue;
				}
				if(hitCheck(player_bullet_x[j],
							player_bullet_y[j],
							img_player_bullet,
							enemies_x[i],
							enemies_y[i],
							img_enemy)){
					//あたっているのでお互いのHPを削る
					player_bullets_hp[j] -= 1;
					enemies_hp[i] -= 1;
				}
			}
		}
	}

	//描画処理
	redraw();

	//処理経過時間及び次のループまでのかんかくを計算
	var deltaTime = (new Date()) - startTime;
	var interval = MSPF - deltaTime;
	if(interval > 0){
		//処理が早すぎるので次のループまで待つ
		setTimeout(mainloop, interval);
	}else{
		//処理が遅すぎるので即時のループを実行する
		setTimeout(mainloop, 0);
	}

	
};

/*
//キーが押された時に呼び出される処理を指定
window.onkeydown = function(e){
	//右矢印が押された時に呼び出される処理を指定
	if(e.keyCode == 39){
		player_x += 2;
	
		redraw();
	}
			

	else if(e.keyCode == 37){
		player_x -= 2;
	
	redraw();
	}
};
*/

//キーが押された時に呼び出される処理
window.onkeydown = function(e){
	//キーを押された状態に更新
	KEYS[e.keyCode] = true;
}
//キーが話された時に呼び出される処理を指定
window.onkeyup = function(e) {
	KEYS[e.keyCode] = false;
}




//ページロード時に呼び出される処理を指定
//window.onload = function(){};までの間に呼び出される。
window.onload = function(){
	/*idを用いてキャンバスオブジェクトを取得し、canvas変数に代入する
	オブジェクト = document.getElementById('id');*/
	canvas = document.getElementById('screen');

	//2次元用の描画コンテキストを取得し代入
	ctx = canvas.getContext('2d');

	//playerの画像(id="player"で指定された<img>)を取得
	img_player = document.getElementById('player')
	//playerの弾画像を所得
	img_player_bullet = document.getElementById('player_bullet');
	//敵キャラの画像(id="enemy"で指定された<img>)を取得
	img_enemy = document.getElementById('enemy')

	//playerの初期位置を設定
	player_x = (canvas.width - player.width) / 2;
	player_y = (canvas.height - player.height) - 20;
	player_hp = 10;

	//弾の書記位置およびHPを指定
	for(var i=0; i<BULLETS; i++){
		player_bullet_x[i] = 0;
		player_bullet_y[i] = 0;
		player_bullets_hp[i] = 0;
	}


	//enemyの画像の初期位置とHPを設定
	for(var i=0; i<ENEMIES; i++){
		enemies_x[i] = Math.random() * (canvas.width - img_enemy.width);
		enemies_y[i] = Math.random() * (canvas.height - img_enemy.height);
		enemies_hp[i] = 2;
	/*解説
	ここではcanvas内でランダムに敵が発生するようにプログラミングされている。
	また、画面の端に表示されると見えなくなるので、img_enemy.heightといった画面のサイズを引いている。
	*/

	//再描画する
	redraw();
	}

	//playerの画像を(player_x,player_y)の位置に描写
	ctx.drawImage(img_player, player_x, player_y);
	//敵キャラの画像を描写
	for(var i = 0; i < ENEMIES; i++){
	ctx.drawImage(img_enemy, player_x[i], player_y[i]);
	}
	//
	//塗りつぶしの色を指定（白）
	ctx.fillStyle = '#fff';
	//塗りつぶされた四角形（横、縦 = 20,30)を(40,55)の位置に描写
	ctx.fillRect(8,5,20,30);

	//線の色を指定(赤)
	ctx.strokeStyle = '#f00';
	//空っぽの四角形（横、横 = 90,10)を(40,55)の位置に描写
	ctx.strokeRect(40,55,90,10);

	//メインループを開始する

	mainloop();

	//タイトルループを開始する
	titleloop();
};


