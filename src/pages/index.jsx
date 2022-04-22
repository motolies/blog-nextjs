import PostComponent from "../components/PostComponent";

export default function Home() {
    // TODO: 메인포스트가 로딩되도록 한다
    const title = '제목';
    const text = `
<div class="col-12 content-body mx-auto mb-3"><style type="text/css">
    div.round {
        width: 95%;
        margin: 5px 0px;
        padding: 10px;
        float: left;
        border-width: 1px;
        border-color: #7f7f7f;
        border-style: solid;
        border-radius: 10px;
    }

    div.round input {
        width: 250px;
    }

    div.item {
        font-weight: bold;
        padding-left: 10px;
    }

    ul.list {
        margin: 0px;
    }

    ul.main {
        margin: 0px;
        padding: 0px;
    }

    li.main {
        display: inline-table;
        padding: 5px;
        font-weight: bold;
    }

    li.item {
        display: inline-table;
        padding: 5px;
    }
</style>

<div class="round">
    <div class="item">검색</div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main"><a style="color: #000" href="http://www.naver.com/">네이버</a></li>
        </ul>
        <input id="naver" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">
                <a style="color: #000" href="https://www.google.com/webhp?gl=US&amp;num=100&amp;newwindow=1">구글</a>
                😊
            </li>
        </ul>
        <input id="google" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main"><a style="color: #000" href="http://www.daum.net/">다음</a></li>
        </ul>
        <input id="daum" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main"><a style="color: #000" href="http://image.google.com/">구글 이미지</a></li>
        </ul>
        <input id="googleImg" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">구글 캐쉬</li>
        </ul>
        <input id="googleCache" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}" placeholder="http://www.google.com">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">우체국 EMS조회</li>
        </ul>
        <input id="ems" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main"><a style="color: #000" href="https://track.rocketparcel.com/track/web">아마존 직배송 조회</a></li>
        </ul>
        <input id="amz" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">알리익스프레스 스탠다드 조회</li>
        </ul>
        <input id="ass" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">블로그 검색(모바일)</li>
        </ul>
        <input id="blog" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">네이버 영어사전</li>
        </ul>
        <input id="naver_dic" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
    <div style="margin-bottom: 10px; margin-left: 30px; display: inline-block">
        <ul class="main">
            <li class="main">네이버 중고나라</li>
        </ul>
        <input id="naver_second_hand" onkeydown="if (event.keyCode == 13){ SearchingQuery();return false;}">
        <br>
    </div>
</div>
<div class="round">
    <div class="item">커뮤니티</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="http://www.clien.net/">클리앙</a></li>
            <li class="item"><a style="color: #000" href="https://okky.kr/">okky</a></li>
            <li class="item"><a style="color: #000" href="http://ssumup.com/">썸업</a></li>
            <li class="item"><a style="color: #000" href="http://m.aagag.com/mirror/?time=12&amp;target=_blank">클리앙 TOP
                100 모바일</a></li>
            <li class="item"><a style="color: #000" href="http://aagag.com/mirror/?time=12&amp;target=_blank">클리앙 TOP
                100</a></li>
            <li class="item"><a style="color: #000" href="http://www.slrclub.com/">SLR CLUB</a></li>
            <li class="item"><a style="color: #000" href="http://www.ppomppu.co.kr/">뽐뿌</a></li>
            <li class="item"><a style="color: #000" href="http://m.ppomppu.co.kr/new/bbs_list.php?id=camping">뽐뿌-캠포-모바일</a></li>
            <li class="item"><a style="color: #000" href="http://m.ppomppu.co.kr/new/bbs_list.php?id=fishing">뽐뿌-낚포-모바일</a></li>
            <li class="item"><a style="color: #000" href="http://www.corearoadbike.com/">도싸</a></li>
            <li class="item"><a style="color: #000" href="https://ruliweb.com/">루리웹</a></li>
            <li class="item"><a style="color: #000" href="https://xn--od1ba.com/">누누.tv</a></li>
        </ul>
    </div>
</div>

<div class="round">
    <div class="item">멤버쉽</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="https://nid.naver.com/membership/partner/uplus">네이버플러스 X
                Lgu+</a></li>
            <li class="item"><a style="color: #000" href="https://nid.naver.com/membership/my">쿠키 선택</a></li>
        </ul>
    </div>
</div>

<div class="round">
    <div class="item">웹테스트 도구</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="https://www.makeareadme.com/">Make readme.md</a></li>
            <li class="item"><a style="color: #000" href="https://codesandbox.io">Code Sandbox</a></li>
            <li class="item"><a style="color: #000" href="https://jsfiddle.net/user/fiddles/all/">Js Fiddle</a></li>
            <li class="item"><a style="color: #000" href="http://coderstoolbox.net/">문자열 인코딩</a></li>
            <li class="item"><a style="color: #000" href="http://poorsql.com/">SQL formatter</a></li>
            <li class="item"><a style="color: #000" href="http://jsbeautifier.org/">Javascript formatter</a></li>
            <li class="item"><a style="color: #000" href="https://www.freeformatter.com/json-formatter.html">Json
                formatter</a></li>
            <li class="item"><a style="color: #000" href="https://htmlformatter.com/">Html formatter</a></li>
            <li class="item"><a style="color: #000" href="https://www.freeformatter.com/xml-formatter.html">XML
                formatter</a></li>
            <li class="item"><a style="color: #000" href="https://codebeautify.org/json-to-java-converter">Json to Java
                Class</a></li>
            <li class="item"><a style="color: #000" href="https://www.epochconverter.com/">Epoch &amp; Unix
                Timestamp</a></li>
            <li class="item"><a style="color: #000" href="https://capitalizemytitle.com/camel-case/">camel-case
                tester</a></li>
        </ul>
    </div>
</div>



<div class="round">
    <div class="item">취미</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="http://www.vpngate.net/en/">VPN Gate</a></li>
            <li class="item"><a style="color: #000" href="https://archive.org/details/softwarelibrary_msdos_games/v2">Almost
                2,400 DOS GAMES using PC Browsers</a></li>
            <li class="item"><a style="color: #000" href="https://archive.org/details/internetarcade">Internet
                Arcade</a></li>
            <li class="item"><a style="color: #000" href="https://runkeeper.com/login/">RunKeeper</a></li>
            <li class="item"><a style="color: #000" href="http://www.youtube.com/">YouTube</a></li>
            <li class="item"><a style="color: #000" href="http://cdmanii.com/1535">YouTube-속도패치</a></li>
            <li class="item"><a style="color: #000" href="http://slds2.tistory.com/">입질의추억</a></li>
            <li class="item"><a style="color: #000" href="http://www.cartok.com/">CarTok</a></li>
            <li class="item"><a style="color: #000" href="http://minix.tistory.com/">미닉스 IT이야기</a></li>
            <li class="item"><a style="color: #000" href="https://pixabay.com/ko/">무료 이미지 PixaBay</a></li>
        </ul>
    </div>
</div>

<div class="round">
    <div class="item">자전거 쇼핑몰</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="http://www.bike-discount.de/">바이크디스카운트</a></li>
            <li class="item"><a style="color: #000" href="http://www.dot5.co.kr/">닷파이브</a></li>
        </ul>
    </div>
</div>

<div class="round">
    <div class="item">논문</div>
    <div>
        <ul class="list">
            <li class="item"><a style="color: #000" href="http://www.ndsl.kr/index.do">NDSL(보고서, 논문검색)</a></li>
            <li class="item"><a style="color: #000" href="http://dl.nanet.go.kr/index.do">국회전자도서관</a></li>
            <li class="item"><a style="color: #000" href="http://www.everyspec.com/">EverySpec</a></li>
            <li class="item"><a style="color: #000" href="http://www.ntis.go.kr/ThMain.do#3">NTIS(과학기술지식정보)</a></li>
        </ul>
    </div>
</div>

<script type="text/javascript">
    function SearchingQuery() {
        var src = event.srcElement

        var url = ''

        switch (src.id) {
            case 'naver':
                url = 'http://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&ie=utf8&query=%s'
                break
            case 'daum':
                url = 'http://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&q=%s'
                break
            case 'google':
                url = 'https://www.google.com/search?gl=US&num=100&newwindow=1&tbs=&q=%s'
                break
            case 'googleImg':
                url = 'https://www.google.com/search?gl=US&biw=1920&bih=955&tbm=isch&sa=1&btnG=%EA%B2%80%EC%83%89&q=%s&oq=&gs_l='
                break
            case 'googleCache':
                url = 'http://webcache.googleusercontent.com/search?q=cache:%s'
                break
            case 'wiki':
                url = 'https://ko.wikipedia.org/w/index.php?search=%s&title=%ED%8A%B9%EC%88%98%3A%EA%B2%80%EC%83%89&go=%EB%B3%B4%EA%B8%B0'
                break
            case 'ems':
                url = 'http://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=%s'
                break
            case 'ems':
                url = 'http://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=%s'
                break
            case 'blog':
                url = 'http://motolies.tistory.com/m/search/%s'
                break
            case 'naver_dic':
                url = 'http://endic.naver.com/search.nhn?sLn=kr&isOnlyViewEE=N&query=%s'
                break
            case 'amz':
                url = 'https://track.shiptrack.co.kr/epost/%s'
                break
            case 'ass':
                url = 'http://ex.actcore.com/inboundOcean/Tracing.wo?method=tracingGuest&statustype=HT&country=KO&refno=%s'
                break
            case 'naver_second_hand':
                url = 'https://cafe.naver.com/ca-fe/home/search/c-articles?ss=ON_SALE&pt=DIRECT&dt=MEET&wp=1w&q=%s'
                break
        }

        url = url.replace('%s', encodeURIComponent(src.value))

        if (src.id != 'naver_second_hand') {
            location.href = url
        } else {
            window.open(url, '_blank').focus()
        }
    }
</script>
</div>
    `
    return (
        <PostComponent title={title} content={text}/>
    )
}
