/**
 * Copyright (c) 2016 ろくろう
 *
 * This software is released under the MIT License.
 *  http://opensource.org/licenses/mit-license.php
 */
/* Symbol name is based on Japanese edition */
/*  */
function Udemae() {
	this.pos = 0;
	this.point = 30;
}
Udemae.list = ['C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S', 'S+'];
Udemae.prototype.state = function() {
	return Udemae.list[this.pos];
};
Udemae.prototype.statex = function() {
	if (this.cnst())
        return this.state() + '99';
    else if (this.pos >= Udemae.list.indexOf('B') && this.point >= 50)
        return this.state() + '50';
    else
        return this.state();
};
Udemae.prototype.cnst = function() {
	return (this.pos == Udemae.list.length - 1) && (this.point >= 99);
};
Udemae.prototype.add = function(point) {
	this.point += point;
	if (this.point > 99)
		if (this.pos == Udemae.list.length - 1)
			this.point = 99;
		else {
			this.pos++;
			this.point = 30;
		}
	else if (this.point < 0)
		if (this.pos == 0)
			this.point = 0;
		else {
			this.pos--;
			this.point = 70;
		}
};
Udemae.prototype.change = function(win, fightstate) {
	switch (this.state()) {
    case 'C-':
        this.add(win ? +20 : -10);
        break;
    case 'C':
        this.add(win ? +15 : -10);
        break;
    case 'C+':
    case 'B-':
        this.add(win ? +12 : -10);
        break;
    default:
        if (this.point < 40)
            this.add(win ? +12 : -8);
        else if (this.point < 80)
            this.add(win ? +10 : -10);
        else
            this.add(win ? +8 : -12);
        break;
    case 'S':
        if (this.point < 40)
            this.add(win ? +5 : -5);
        else if (this.point < 80)
            this.add(win ? +4 : -5);
        else
            this.add(win ? +4 : -6);
        break;
    case 'S+':
        if (this.point < 40)
            this.add(win ? +4 : -4);
        else if (this.point < 80)
            this.add(win ? +3 : -5);
        else
            this.add(win ? +2 : -5);
        break;
    }
};
Udemae.prototype.toString = function() {
	return this.state() + this.point;
};
/* */
function Inkling(power) {
	this.power = power || 1;
	this.udemae = new Udemae();
}
Inkling.prototype.valueOf = function() {
    return this.power;
};
Inkling.prototype.win = function(rslt) {
    return this.udemae.change(rslt);
};
/* */
function Team(members) {
	this.members = members;
}
Team.prototype.power = function() {
    return this.members.reduce(function(p, c) {return p + c;});
};
Team.prototype.result = function(winner) {
    var rslt = this == winner;
    this.members.map(function(ika) {ika.win(rslt)});
};
/* */
function Room() {
	this.members = [];
}
Room.prototype.full = function(ika) {
	return this.members.length == 8;
};
Room.prototype.entry = function(ika) {
    this.members.push(ika);
};
Room.prototype.empty = function() {
	this.members.length = 0;
};
Room.prototype.fight = function() {
//    shuffle(this.members);
    var half = Math.floor(this.members.length / 2);
	var pink = new Team(this.members.slice(0, half));
	var green = new Team(this.members.slice(half));
    var winner = pink.power() > green.power() ? pink : green;
	pink.result(winner);
	green.result(winner);
};
/* */
function Lobby() {
	this.inklings = [];
    this.count = 0;
}
Lobby.prototype.sort = function() {
	this.inklings.sort(function (a, b) {
		if (a.udemae.pos == b.udemae.pos)
//			return a.udemae.point - b.udemae.point;
			return Math.random() < 0.5 ? -1 : 1;
		else
			return b.udemae.pos - a.udemae.pos;
	});
};
Lobby.prototype.entry = function(power) {
	this.inklings.push(new Inkling(power));
};
Lobby.prototype.escape = function(ika) {
	this.inklings.splice(this.inklings.indexOf(ika), 1);
};
Lobby.prototype.matching = function() {
    this.sort();
    var room = new Room();
    var ika = this.inklings[0];
	for (var i = 0; i < this.inklings.length; i++) {
        switch (ika.udemae.state()) {
        case 'S+':
        case 'S':
        case 'A-':
        case 'B-':
        // 同ランクのみマッチング
            if (ika.udemae.pos != this.inklings[i].udemae.pos)
                room.empty();
            break;
        }
        ika = this.inklings[i];
        room.entry(ika);
        if (room.full()) {
            room.fight();
            room.empty();
        }
    }
    this.count++;
};
function udemap(ikas) {
    var map = {};
    for (var i = 0; i < Udemae.list.length; i++) {
        var state = Udemae.list[i];
        map[state] = 0;
        if (i >= Udemae.list.indexOf('B'))
            map[state + '50'] = 0;
        if (i == Udemae.list.length - 1)
            map[state + '99'] = 0;
    }
    for (var i = 0; i < ikas.length; i++) {
        map[ikas[i].udemae.statex()]++;
    }
    return map;
}
/* util */
function shuffle(array) {
    var n = array.length, t, i;
    while (n) {
        i = Math.floor(Math.random() * n--);
        t = array[n];
        array[n] = array[i];
        array[i] = t;
    }
}
/* */
var interval;
var timeout;
var lobby;
var me;
window.addEventListener("DOMContentLoaded", function() {
    document.getElementById('start').addEventListener("mousedown", taskStart, false);
    document.getElementById('start').addEventListener("touchstart", taskStart, false);
    document.getElementById('start').addEventListener("mouseup", taskClear, true);
    document.getElementById('start').addEventListener("mouseout", taskClear, true);
    document.getElementById('start').addEventListener("touchend", taskClear, true);
    var ls = document.querySelectorAll('.distr input');
    for (var i = 0; i < ls.length; i++)
        ls.item(i).addEventListener("change", listChange, false);
    document.querySelector('.me input.pow').addEventListener("change", meChange, false);
    listChange();
},  false);
function taskStart() {
    taskClear();
    timeout = window.setTimeout(function() {
        interval = window.setInterval(buttonClick, 0);
    }, 400);
}
function taskClear() {
    if (timeout) window.clearTimeout(timeout);
    if (interval) window.clearInterval(interval);
}
function getList() {
    var list = [];
    list.push([Number(document.querySelector('.me .pow').value), 1]);
    var distr = document.querySelectorAll('.distr');
    for (var i = 0; i < distr.length; i++) {
        var ele = distr.item(i);
        list.push([Number(ele.querySelector('.pow').value),
                    Number(ele.querySelector('.num').value)]);
    }
    return list;
}
function listChange() {
    lobby = new Lobby();
    // [ [実力,人数], [実力,人数] ]
//    var list = JSON.parse(document.getElementById('stdin').value);
    var list = getList();
    for (var i = 0; i < list.length; i++) {
        var pow = list[i][0];
        var num = list[i][1];
        for (var j = 0; j < num; j++) {
            if (pow)
                lobby.entry(pow);
        }
    }
    me = lobby.inklings[0];
}
function meChange() {
    if (me) {
        var p = Number(this.value);
        if (p)
            me.power = p;
        else
            this.value = me.power;
    }
}
function buttonClick() {
    lobby.matching();
    updateMap(udemap(lobby.inklings));
}
function updateMap(map) {
    for (var id in map) {
        var li = document.getElementById(id);
        li.innerHTML = map[id];
        li.parentNode.classList.remove('me');
    }
    document.getElementById(me.udemae.statex()).parentNode.classList.add('me');
    document.getElementById('count').innerHTML = lobby.count;
}