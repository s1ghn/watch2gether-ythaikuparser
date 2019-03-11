// ==UserScript==
// @name         Youtubehaikuparser
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.watch2gether.com/rooms/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

// w2g cant handle more than 50
let limit = 50;

let orderby = 'new'     // you can sort by "new", "hot", or everything else the reddit api excepts as param
let ups_min = 250;        // how many upvotes does a post need


let url = 'https://www.reddit.com/r/youtubehaiku/new.json?sort='+ orderby +'&limit=100';

let room = location.pathname.substr( location.pathname.lastIndexOf( '/' ) + 1 );
let playlistID;

// add btn
$(function() {
    let btn = document.createElement('div');
    playlistID = $(".selection.dropdown").val();

    btn.className = 'item';
    btn.style.cursor = 'pointer';
    btn.innerHTML = 'Add Haikus';
    btn.addEventListener( 'click' , findHaikus);
    $('.w2g-topbar-content').append(btn);
})

// search in Reddit
function findHaikus( page, playlist = [] ) {
    let req = url;

    if ( page ) {
        req += '&after=' + page;
    }

    $.get( req, data => {

        let posts = data.data.children;
        let nextPage = data.data.after;

        let limitReached = false;

        posts.forEach(p => {
            let video = p.data.url;
            let title = p.data.title;
            let thumb = p.data.thumbnail;
            let ups = p.data.ups;

            // check if youtube is in the url
            if ( ! video.match( /\/\/(www\.)?youtu(\.)?be/ ) ) {
                return;
            }

            // compare ups
            if ( ups < ups_min ) {
                return;
            }

            if ( playlist.length >= limit ) {
                return limitReached = true;
            }

            playlist.push( {
                url: video,
                title: title,
                thumb: thumb
            } );
        });

        if ( limitReached ) {
            console.log( playlist );
            return createPlaylist( playlist );
        }

        findHaikus( nextPage, playlist );
    } )
}

// w2g stuff
function createPlaylist(posts) {
    $w2g.postJSON("/rooms/" + room + "/playlists/" + playlistID + "/playlist_items/sync_update", {
        add_items: JSON.stringify(posts)
    });
}
