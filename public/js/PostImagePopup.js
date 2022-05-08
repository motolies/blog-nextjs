function simpleLightbox(imageUrl, bgColor, maxWidth) {
    if (typeof bgColor === 'undefined') {
        bgColor = '#000'
    }
    if (typeof maxWidth === 'undefined') {
        maxWidth = '1100px'
    }
    window.open('', 'simpleLightbox').document.write('<html><head><meta name="viewport" content="user-scalable=yes, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, width=device-width" /></head><body style="margin:0; background:'+bgColor+';height:100%;" onclick="javascript:window.close(\'simpleLightbox\');"><table border="0" width="100%" height="100%"><tr><td valign="middle" align="center"><img style="position:relative;z-index:2;width:100%;max-width:'+maxWidth+';" src="'+imageUrl+'"/></td></tr></table></body></html>');
}

const imgs = document.querySelectorAll('#post-content img')
for (let i = 0; i < imgs.length; i++) {
    let currentImg = imgs[i]
    currentImg.addEventListener('click', function (e) {
        simpleLightbox(currentImg.src)
    })
}