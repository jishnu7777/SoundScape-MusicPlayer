let curSong = new Audio();
let oldUniqueIDclass;
let oldUniqueID;
let curFolder;
let percentage = 30;
let uniqueID;
let uniqueIDclass;
let songDetails;
let songs;
let formattedSongs;
let isRepeatOn = false;
let isShuffleOn = false;
let curTrackindex = 0;
let equaliserSrc = 'https://open.spotifycdn.com/cdn/images/equaliser-green.f8937a92.svg';
let currentCardHeading = null;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getFolders() {
    let response = await fetch(`/cards/`);
    let responseText = await response.text();
    let div = document.createElement("div");
    div.innerHTML = responseText;

    let as = div.getElementsByTagName("a");
    let folders = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith('/')) {
            let folderName = element.textContent || element.innerText;
            if (folderName.endsWith('/')) {
                folderName = folderName.slice(0, -1);
            }
            folders.push(folderName);
        }
    }
    folders.shift();
    return shuffleArray(folders);
}

async function fetchJSONFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        return error;
    }
}

async function getSongs(folder = "phonk") {
    curFolder = folder;
    let a = await fetch(`/cards/${folder}/songs`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let songName = element.href.split(`/${folder}/songs/`)[1];
            songs.push(decodeURIComponent(songName).split(' '));
        }
    }
    return songs;
}

async function generatePlaylistCards(folders) {
    let ele = document.querySelector('.card-container')
    ele.innerHTML = ""

    for (let folder of folders) {
        let data = await fetchJSONFile(`/cards/${folder}/info.json`)
        ele.innerHTML += `<div class="card">
              <img id="${folder}" class="spotify-play" src="img/spotifyplay.svg" alt="play button">
              <img src="/cards/${folder}/${folder}.jpg" alt="">
              <div class="card-text">
                <h2>${data.title}</h2>
                <p>${data.description}</p>
              </div>
            </div>`
    }
}

function extractArtistAndSong(songs) {
    return songs.map(songArray => {
        let dashIndex = songArray.indexOf('-');
        let artist = songArray.slice(0, dashIndex).join(' ');
        let song = songArray.slice(dashIndex + 1).join(' ').replace('.mp3', '');
        return { artist, song };
    });
}

function generateSongList(songDetails) {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songDetails) {
        let newSongname = song.song;
        let newArtistname = song.artist;

        if (song.song.length > 10) {
            newSongname = newSongname.slice(0, 5) + "...";
        }

        if (song.artist.length > 10) {
            newArtistname = newArtistname.slice(0, 5) + "...";
        }

        const songID = `${song.artist} - ${song.song}.mp3`;
        let className = songID.replace(/[^a-zA-Z0-9]/g, '_');

        songUL.innerHTML += `<li>
            <img width="34" src="img/music.svg" alt="">
            <div class="info">
                <div class="${className} song-name">${newSongname}</div>
                <div class="song-artist">${newArtistname}</div>
            </div>
            <div class="playnow">
                <span class="${className}">Play Now</span>
                <img class="${className}" id="${songID}" src="img/playbutton.svg" alt="">
            </div></li>`;
    }
}

function playAudio(track, pause = false) {
    let trimmedFileName = track.replace('.mp3', '');
    let parts = trimmedFileName.split(' - ');
    let artist = parts[0];
    let song = parts[1];
    let ele = document.querySelector('.song-info').getElementsByTagName('div');
    ele[0].innerHTML = song;
    ele[1].innerHTML = artist;
    document.querySelector('.song-label').src = 'img/music.svg';
    curSong.src = `/cards/${curFolder}/songs/${track}`;
    if (!pause) {
        curSong.oncanplay = () => {
            curSong.play();
            play.src = 'img/pause.svg';
        };
    }
}

function updateSeekbar() {
    const percent = (curSong.currentTime / curSong.duration) * 100;
    document.querySelector('.circle').style.left = percent + "%";
    document.querySelector('.filled').style.width = percent + "%";
}

function updateColors(uniqueID, uniqueIDclass, color, text) {
    const elements = document.querySelectorAll(`.${uniqueIDclass}`);
    if (color === "#1dd65f") {
        uniqueID.src = equaliserSrc
    }
    if (color === "white") {
        uniqueID.src = 'img/playbutton.svg';
    }
    elements[1].innerHTML = text;
    elements[1].style.color = color;

    if (text === "Paused") {
        elements[0].style.color = "#1dd65f";
        uniqueID.src = 'img/playbutton.svg';
    } else {
        elements[0].style.color = color;
    }
}

function playNextSong(formattedSongs) {
    if (isRepeatOn) {
        curSong.currentTime = 0;
        curSong.play();
    } else {
        if (isShuffleOn) {
            curTrackindex = Math.floor(Math.random() * formattedSongs.length);
        } else {
            curTrackindex = (curTrackindex + 1) % formattedSongs.length;
        }
        let nextTrack = formattedSongs[curTrackindex];
        playAudio(nextTrack);
    }
}

async function main() {
    let folders = await getFolders();
    await generatePlaylistCards(folders);

    Array.from(document.querySelectorAll('.spotify-play')).forEach(e => {
        e.addEventListener("click", async () => {
            if (currentCardHeading) {
                currentCardHeading.style.color = "white";
            }
            const cardHeading = e.closest('.card').querySelector('h2');
            cardHeading.style.color = "#1db954";
            currentCardHeading = cardHeading;

            songs = await getSongs(`${e.id}`);
            songDetails = extractArtistAndSong(songs);
            generateSongList(songDetails);
            formattedSongs = songs.map(songArray => songArray.join(' '));
            playAudio(formattedSongs[0]);
            uniqueID = document.getElementById(`${formattedSongs[0]}`);
            uniqueIDclass = uniqueID.id.replace(/[^a-zA-Z0-9]/g, '_');
            updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");

            let url = curSong.src;
            const extractedPart = url.substring(url.lastIndexOf('/') + 1);
            const curTrack = decodeURIComponent(extractedPart);
            curTrackindex = formattedSongs.indexOf(curTrack);

            Array.from(document.querySelectorAll('.playnow')).forEach(e => {
                let img = e.getElementsByTagName('img')[0];
                img.addEventListener("click", () => {
                    playAudio(img.id);
                    curTrackindex = formattedSongs.indexOf(img.id);
                    oldUniqueID = uniqueID;
                    oldUniqueIDclass = uniqueIDclass;
                    uniqueID = img;
                    uniqueIDclass = img.id.replace(/[^a-zA-Z0-9]/g, '_');
                    updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");

                    if (oldUniqueIDclass && oldUniqueIDclass !== uniqueIDclass) {
                        updateColors(oldUniqueID, oldUniqueIDclass, "white", "Play Now");
                    }
                });

                let span = e.getElementsByTagName('span')[0];
                span.addEventListener("click", () => {
                    playAudio(span.className);
                    curTrackindex = formattedSongs.indexOf(span.className);
                    oldUniqueID = uniqueID;
                    oldUniqueIDclass = uniqueIDclass;
                    uniqueID = span;
                    uniqueIDclass = span.className.replace(/[^a-zA-Z0-9]/g, '_');
                    updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");

                    if (oldUniqueIDclass && oldUniqueIDclass !== uniqueIDclass) {
                        updateColors(oldUniqueID, oldUniqueIDclass, "white", "Play Now");
                    }
                });
            });
        });
    });

    const play = document.querySelector(".play");
    const previous = document.querySelector(".previous");
    const next = document.querySelector(".next");
    const repeat = document.querySelector('.repeat');
    const shuffle = document.querySelector('.shuffle');

    play.addEventListener("click", () => {
        if (curSong.paused) {
            curSong.play();
            play.src = 'img/pause.svg';
            updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");
        } else {
            curSong.pause();
            play.src = 'img/play.svg';
            updateColors(uniqueID, uniqueIDclass, "#4d4d4d", "Paused");
        }
    });

    next.addEventListener("click", () => {
        if (isShuffleOn) {
            curTrackindex = Math.floor(Math.random() * formattedSongs.length);
        } else {
            curTrackindex = (curTrackindex + 1) % formattedSongs.length;
        }
        oldUniqueID = uniqueID;
        oldUniqueIDclass = uniqueIDclass;
        updateColors(oldUniqueID, oldUniqueIDclass, "white", "Play Now");
        uniqueIDclass = formattedSongs[curTrackindex].replace(/[^a-zA-Z0-9]/g, '_');
        uniqueID = document.getElementsByClassName(uniqueIDclass)[2];
        updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");
        playAudio(formattedSongs[curTrackindex]);
    });

    previous.addEventListener("click", () => {
        if (curTrackindex === 0) {
            curTrackindex = formattedSongs.length - 1;
        } else {
            curTrackindex -= 1;
        }
        oldUniqueID = uniqueID;
        oldUniqueIDclass = uniqueIDclass;
        updateColors(oldUniqueID, oldUniqueIDclass, "white", "Play Now");
        uniqueIDclass = formattedSongs[curTrackindex].replace(/[^a-zA-Z0-9]/g, '_');
        uniqueID = document.getElementsByClassName(uniqueIDclass)[2];
        updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");
        playAudio(formattedSongs[curTrackindex]);
    });

    repeat.addEventListener('click', () => {
        isRepeatOn = !isRepeatOn;
        if (isRepeatOn) {
            document.querySelector('.repeat').src = 'img/repeat-on.svg';
        } else {
            document.querySelector('.repeat').src = 'img/repeat-off.svg';
        }
    });

    shuffle.addEventListener('click', () => {
        isShuffleOn = !isShuffleOn;
        if (isShuffleOn) {
            document.querySelector('.shuffle').src = 'img/shuffle-on.svg';
        } else {
            document.querySelector('.shuffle').src = 'img/shuffle-off.svg';
        }
    });

    curSong.addEventListener('timeupdate', () => {
        document.querySelector('.start').innerHTML = secondsToMinutesSeconds(curSong.currentTime);
        document.querySelector('.circle').style.left = (curSong.currentTime / curSong.duration) * 100 + "%";
        updateSeekbar();
    });

    curSong.addEventListener('loadedmetadata', () => {
        document.querySelector('.start').innerHTML = secondsToMinutesSeconds(curSong.currentTime);
        document.querySelector('.circle').style.left = (curSong.currentTime / curSong.duration) * 100 + "%";
        document.querySelector('.end').innerHTML = secondsToMinutesSeconds(curSong.duration);
        updateSeekbar();
    });

    curSong.addEventListener('play', () => {
        document.querySelector('.start').innerHTML = secondsToMinutesSeconds(curSong.currentTime);
        document.querySelector('.circle').style.left = (curSong.currentTime / curSong.duration) * 100 + "%";
        updateSeekbar();
    });

    curSong.addEventListener('ended', () => {
        if (isRepeatOn) {
            curSong.currentTime = 0;
            curSong.play();
        } else {
            playNextSong(formattedSongs);
        }
        oldUniqueID = uniqueID;
        oldUniqueIDclass = uniqueIDclass;
        updateColors(oldUniqueID, oldUniqueIDclass, "white", "Play Now");
        uniqueIDclass = formattedSongs[curTrackindex].replace(/[^a-zA-Z0-9]/g, '_');
        uniqueID = document.getElementsByClassName(uniqueIDclass)[2];
        updateColors(uniqueID, uniqueIDclass, "#1dd65f", "Playing");
    });

    let isDraggingSeekbar = false;

    document.querySelector(".seekbar").addEventListener("mousedown", e => {
        isDraggingSeekbar = true;
        const seekbar = e.currentTarget;
        const seekbarRect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - seekbarRect.left;
        const percent = (offsetX / seekbarRect.width) * 100;

        curSong.currentTime = (curSong.duration * percent) / 100;
        updateSeekbar();
    });

    document.addEventListener("mousemove", e => {
        if (isDraggingSeekbar) {
            const seekbar = document.querySelector(".seekbar");
            const seekbarRect = seekbar.getBoundingClientRect();
            const offsetX = e.clientX - seekbarRect.left;
            const percent = (offsetX / seekbarRect.width) * 100;

            curSong.currentTime = (curSong.duration * Math.min(Math.max(percent, 0), 100)) / 100;
            updateSeekbar();
        }
    });

    document.addEventListener("mouseup", () => {
        isDraggingSeekbar = false;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const seekbar = e.currentTarget;
        const seekbarRect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - seekbarRect.left;
        const percent = (offsetX / seekbarRect.width) * 100;

        curSong.currentTime = (curSong.duration * percent) / 100;
        updateSeekbar();
    });

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            play.click();
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left-box").style.left = "0"
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left-box").style.left = "-130%"
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const volumeIcon = document.querySelector('.volume-rocker .volume-icon');
    const volumeBar = document.querySelector('.volume-rocker .volume-control-bar');
    const filled = volumeBar.querySelector('.filled');
    const circle = volumeBar.querySelector('.circle');

    volumeIcon.addEventListener('click', () => {
        if (volumeIcon.classList.contains('on')) {
            volumeIcon.classList.remove('on');
            volumeIcon.classList.add('off');
            volumeIcon.src = 'img/mute.svg';
            updateVolume(0);
            curSong.volume = 0;
        } else {
            volumeIcon.classList.remove('off');
            volumeIcon.classList.add('on');
            volumeIcon.src = 'img/volume.svg';
            updateVolume(percentage);
            curSong.volume = percentage / 100;
        }
    });

    const updateVolume = (percentage) => {
        if (percentage === 0) {
            volumeIcon.src = 'img/mute.svg';
        }
        else {
            volumeIcon.src = 'img/volume.svg';
        }
        filled.style.width = `${percentage}%`;
        circle.style.left = `${percentage}%`;
        curSong.volume = percentage / 100;
    };

    const setVolume = (event) => {
        const rect = volumeBar.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        percentage = Math.min(Math.max((offsetX / rect.width) * 100, 0), 100);
        updateVolume(percentage);
    };

    let isDragging = false;

    circle.addEventListener('mousedown', () => {
        isDragging = true;
        document.addEventListener('mousemove', setVolume);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', setVolume);
        }, { once: true });
    });

    volumeBar.addEventListener('click', (event) => {
        setVolume(event);
    });
});

main();
