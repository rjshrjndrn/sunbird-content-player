Renderer = {
    loader: undefined,
    theme: undefined,
    update: true,
    gdata: undefined,
    running: false,
    preview: false,
    divIds: {
        gameArea: 'gameArea',
        canvas: 'gameCanvas'
    },
    resizeGame: function(disableDraw) {
        var gameArea = document.getElementById(Renderer.divIds.gameArea);
        var widthToHeight = 16 / 9;
        var newWidth = window.innerWidth;
        var newHeight = window.innerHeight;
        var newWidthToHeight = newWidth / newHeight;
        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
            gameArea.style.height = newHeight + 'px';
            gameArea.style.width = newWidth + 'px';
        } else {
            newHeight = newWidth / widthToHeight;
            gameArea.style.width = newWidth + 'px';
            gameArea.style.height = newHeight + 'px';
        }

        gameArea.style.marginTop = (-newHeight / 2) + 'px';
        gameArea.style.marginLeft = (-newWidth / 2) + 'px';
        Renderer.theme.updateCanvas(newWidth, newHeight);
        if(!disableDraw) Renderer.theme.reRender();
    },
    start: function(gameRelPath, canvasId, game, data, preview) {
        if(Renderer.running) {
            Renderer.cleanUp();
        }
        Renderer.running = true;
        Renderer.preview = preview || false;
        var identifier = (game && game.identifier) ? game.identifier : null;
        var version = (game && game.pkgVersion) ? game.pkgVersion : "1";
        TelemetryService.start(identifier, version);
        if (data) {
            Renderer.init(data, canvasId, gameRelPath);
        } else {
            Renderer.initByJSON(gameRelPath, canvasId);
            if (typeof sensibol != "undefined") {
                sensibol.recorder.init(gameRelPath + "/lesson.metadata")
                .then(function(res) {
                    console.info("Init lesson successful.", res);
                })
                .catch(function(err) {
                    console.error("Error while init lesson:", err);
                });
            }
        }
    },
    initByJSON: function(gameRelPath, canvasId) {
        jQuery.getJSON(gameRelPath + '/index.json', function(data) {
            Renderer.init(data, canvasId, gameRelPath);
        })
        .fail(function() {
            Renderer.initByXML(gameRelPath, canvasId)
        });
    },
    initByXML: function(gameRelPath, canvasId) {
        jQuery.get(gameRelPath + '/index.ecml', function(data) {
            Renderer.init(data, canvasId, gameRelPath);
        },null, 'xml')
        .fail(function(err) {
            alert("Unable to render.", err);
        });
    },
    init: function(data, canvasId, gameRelPath) {
        if(!jQuery.isPlainObject(data)) {
            var x2js = new X2JS({attributePrefix: 'none'});
            data = x2js.xml2json(data);
        }
        Renderer.gdata = data;
        data.theme.canvasId = canvasId;
        Renderer.theme = new ThemePlugin(data.theme);
        Renderer.resizeGame(true);
        Renderer.theme.baseDir = gameRelPath;
        Renderer.theme.start(gameRelPath.replace('file:///', '') + "/assets/");
        createjs.Ticker.setFPS(60);
        createjs.Ticker.addEventListener("tick", function() {
            if(Renderer.update) {
                Renderer.theme.update();
                Renderer.update = false;
            } else {
                if (Renderer.theme) {
                    Renderer.theme.tick();
                }
            }
        });
    },
    cleanUp: function() {
        Renderer.running = false;
        PluginManager.cleanUp();
        AnimationManager.cleanUp();
        AssetManager.destroy();
        TimerManager.destroy();
        Renderer.theme.cleanUp();
        Renderer.theme = undefined;
        TelemetryService.end();
    },
    pause: function() {
        if(Renderer.theme)
            Renderer.theme.pause();
    },
    resume: function() {
        if(Renderer.theme)
            Renderer.theme.resume();
    }
}