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
let ups_min = 0;        // how many upvotes does a post need


let url = 'https://www.reddit.com/r/youtubehaiku/new.json?sort='+ orderby +'&limit=100';

// add btn
$(function() {
    let btn = document.createElement('div');
    btn.className = 'item';
    btn.style.cursor = 'pointer';
    btn.innerHTML = 'Add Haikus';
    btn.addEventListener( 'click' , addHaikus);
    $('.topbar-menu > .ui').prepend(btn);
})

// add Haikus to first Playlist
function addHaikus( page, count ) {
    if ( !count ) {
        count = limit;
    }

    let req = url;

    if ( page ) {
        req += '&after=' + page;
    }

    $.get( req, (data) => {

        let posts = data.data.children;
        let room = location.pathname.substr( location.pathname.lastIndexOf( '/' ) + 1 );

        let nextPage = data.data.after;

        $w2g.getJSON("/streams/" + room + "/playlists").then(function(e) {
            let playlistID = e[0].key;
            let postObject = [];
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
                
                if ( count <= 0 ) {
                    return limitReached = true;
                }
                
                postObject.push( {
                    url: video,
                    title: title,
                    thumb: thumb
                } );

                count--;
            });

            $w2g.postJSON("/rooms/" + room + "/playlists/" + playlistID + "/playlist_items/sync_update", {
                add_items: JSON.stringify(postObject)
            });

            if ( limitReached ) {
                return;
            }

            addHaikus( nextPage, count );

        });
    } )
}
