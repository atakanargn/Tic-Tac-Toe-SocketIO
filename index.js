var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cors = require('cors');
var mongoose = require('mongoose');
const { parse } = require('path');

app.use(cors());
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

var x_kisisi = '';
var o_kisisi = '';
var gelenler = [];
var kullanicilar = [];
var matris = ['', '', '', '', '', '', '', '', '']
var sira = -1;

Array.prototype.remove = function() {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

io.on('connection', function(socket) {
    socket.on('send-nickname', function(nickname) {
        socket.nickname = nickname;

        for (var i = 0; i < kullanicilar.length; i++) {
            if (kullanicilar[i] == nickname) {
                socket.emit('alinmis');
                return;
            }
        }

        gelenler.push(socket);
        kullanicilar.push(nickname);
        if (x_kisisi == '') {
            x_kisisi = nickname;
            socket.emit('x');
        } else if (o_kisisi == '') {
            o_kisisi = nickname;
            socket.emit('o');
            sira = 0;
            for (var i = 0; i < gelenler.length; i++) {
                gelenler[i].emit('mesaj', 'Oyun başladı sıra X\'te');
            }
        } else if (x_kisisi != '' && o_kisisi != '') {
            socket.emit('dolu');
        }

        for (var i = 0; i < gelenler.length; i++) {
            gelenler[i].emit('oyuncular', kullanicilar);
        }

        for (var i = 0; i < gelenler.length; i++) {
            gelenler[i].emit('boxes', matris);
        }
    });

    socket.on('disconnect', function() {
        for (var i = 0; i < gelenler.length; i++) {
            if (socket == gelenler[i]) {
                gelenler.remove(gelenler[i]);
                kullanicilar.remove(kullanicilar[i]);
                for (var i = 0; i < gelenler.length; i++) {
                    gelenler[i].emit('oyuncular', kullanicilar);
                }
                return;
            }
        }
    });

    socket.on('hamle', function(box) {
        if (sira == -1) {
            socket.emit('mesaj', 'Arkadaşını bekler misin?')
        } else if (sira == -2) {
            socket.emit('mesaj', 'Oyun bitmiş!')
        } else if (socket.nickname == x_kisisi && sira == 0) {
            if (matris[parseInt(box)] == '') {
                matris[parseInt(box)] = 'X';

                if (matris[0] == 'X' && matris[1] == 'X' && matris[2] == 'X' ||
                    matris[3] == 'X' && matris[4] == 'X' && matris[5] == 'X' ||
                    matris[6] == 'X' && matris[7] == 'X' && matris[8] == 'X' ||
                    matris[0] == 'X' && matris[3] == 'X' && matris[6] == 'X' ||
                    matris[1] == 'X' && matris[4] == 'X' && matris[7] == 'X' ||
                    matris[2] == 'X' && matris[5] == 'X' && matris[8] == 'X' ||
                    matris[0] == 'X' && matris[4] == 'X' && matris[8] == 'X' ||
                    matris[2] == 'X' && matris[4] == 'X' && matris[6] == 'X') {
                    for (var i = 0; i < gelenler.length; i++) {
                        gelenler[i].emit('mesaj', x_kisisi + " KAZANDI!\nOyun bitti.");
                    }
                    sira = -2;
                    return;
                }

                sira = 1;
                for (var i = 0; i < gelenler.length; i++) {
                    gelenler[i].emit('boxes', matris);
                }
            }
        } else if (socket.nickname == o_kisisi && sira == 1) {
            if (matris[parseInt(box)] == '') {
                matris[parseInt(box)] = 'O';

                if (matris[0] == 'O' && matris[1] == 'O' && matris[2] == 'O' ||
                    matris[3] == 'O' && matris[4] == 'O' && matris[5] == 'O' ||
                    matris[6] == 'O' && matris[7] == 'O' && matris[8] == 'O' ||
                    matris[0] == 'O' && matris[3] == 'O' && matris[6] == 'O' ||
                    matris[1] == 'O' && matris[4] == 'O' && matris[7] == 'O' ||
                    matris[2] == 'O' && matris[5] == 'O' && matris[8] == 'O' ||
                    matris[0] == 'O' && matris[4] == 'O' && matris[8] == 'O' ||
                    matris[2] == 'O' && matris[4] == 'O' && matris[6] == 'O') {
                    for (var i = 0; i < gelenler.length; i++) {
                        gelenler[i].emit('mesaj', o_kisisi + " KAZANDI!\nOyun bitti.");
                    }
                    sira = -2;
                    return;
                }

                sira = 0;
                for (var i = 0; i < gelenler.length; i++) {
                    gelenler[i].emit('boxes', matris);
                }
            }
        } else {
            socket.emit('mesaj', 'Senin sıran değil!')
        }
    });
});

http.listen();