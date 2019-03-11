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

let orderby = 'top'      // you can sort by "new", "hot", or everything else the reddit api excepts as param
let sort = 'day'         // hour, day, week, month, year, all
let ups_min = 20;        // how many upvotes does a post need
let fail_after_tries = 20;
let fail_after = 20;
let url;

let room = location.pathname.substr( location.pathname.lastIndexOf( '/' ) + 1 );
let playlistID;

// add btn
$(function() {
    // set playlist ID
    playlistID = $(".selection.dropdown").val();

    let btn = document.createElement('div');
    btn.className = 'item';
    btn.style.cursor = 'pointer';
    btn.innerHTML = 'Add Haikus';
    btn.addEventListener( 'click' , startHaiku);
    $('.w2g-sidebar').prepend("<hr style='width: 100%;'>");
    $('.w2g-sidebar').prepend(btn);
    $('.w2g-sidebar').prepend("<input id='reddit_ups' type='text' width='30' value='20' placeholder='Upvotes' style='min-height: 25px;'>");
    $('.w2g-sidebar').prepend("<select id='reddit_sort' style='min-height: 25px;'><option value='hour'>hour</option><option value='day' selected>day</option><option value='week'>week</option><option value='month'>month</option><option value='year'>year</option><option value='all'>all</option></select>");
    $('.w2g-sidebar-message').hide();
})

function startHaiku(){
    sort = $("#reddit_sort").val();
    ups_min = $("#reddit_ups").val();
    fail_after = fail_after_tries;
    let sub = $("#search-bar-input").val() || "youtubehaiku";
    url = 'https://www.reddit.com/r/'+sub+'/'+ orderby +'.json?t='+sort+'&limit=50';
    findHaikus();
}

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
