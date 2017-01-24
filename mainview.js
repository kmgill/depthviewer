

var MainView = function() {

    var scope = this;

    var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
    var HUD_MARGIN = 0.05;

    // Controllable options
    var displacementDirection = -1; // To invert, set to -1
    var displacementScale = 100;
    var displacementBias = 90;

    var bumpScale = 10;
    var showHUD = false;
    var renderAnaglyph
    var lightShadowMapViewer;

    var useColorAltimetry = false;
    var diffuseTexture = null;

    var stats = new Stats();

    var container = document.createElement( 'div' );
    document.body.appendChild( container );


    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 3000  );

    var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.sortObjects = false;
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    camera.position.set( 500, 250, 500 );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) )


    //var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    //directionalLight.position.set( 50, 100, 50 ).normalize();
    //scene.add( directionalLight );



    //var ambientLight = new THREE.AmbientLight( 0x333333 );
    //scene.add( ambientLight );
    light = new THREE.SpotLight( 0xffffff, 1.5, 0, Math.PI / 2 );
    light.position.set( 0,1500, 1000);
    light.target.position.set( 0, 0, 0 );
    light.castShadow = true;
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera(50, 1, 1200, 2500 ) );
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add( light );

    createHUD();

    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    var width = window.innerWidth || 2;
    var height = window.innerHeight || 2;
    anaglyph = new THREE.AnaglyphEffect( renderer );
    anaglyph.setSize( width, height );

    scene.add( new THREE.GridHelper( 1000, 10 ) );

    var geometry = new THREE.PlaneGeometry( 400, 400, 512, 512 );


    var material = new THREE.MeshStandardMaterial({
        roughness: 0.9,
        metalness: 0.2,
        displacementScale: (displacementScale * displacementDirection),
        displacementBias: displacementBias
    });


    var plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -70 * Math.PI / 180.0;
    plane.rotation.y = 35 * Math.PI / 180.0;
    plane.rotation.order = "YXZ";

    plane.castShadow = true;
    plane.receiveShadow = true;
    scene.add( plane );

    //controls = new THREE.OrbitControls( camera, renderer.domElement );
    //controls.enableZoom = true;
    //controls.enableDamping = true;

    var control = new THREE.TransformControls( camera, renderer.domElement );
    control.addEventListener( 'change', render );
    ///control.setSpace( "local" );
    control.attach( plane );
    scene.add( control );

    function createHUD() {
        lightShadowMapViewer = new THREE.ShadowMapViewer( light );
        lightShadowMapViewer.position.x = 10;
        lightShadowMapViewer.position.y = window.innerHeight - ( SHADOW_MAP_HEIGHT / 4 ) - 10;
        lightShadowMapViewer.size.width = SHADOW_MAP_WIDTH / 4;
        lightShadowMapViewer.size.height = SHADOW_MAP_HEIGHT / 4;
        lightShadowMapViewer.update();
    }


    window.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 81: // Q
                control.setSpace( control.space === "local" ? "world" : "local" );
                break;
            case 17: // Ctrl
                control.setTranslationSnap( 100 );
                control.setRotationSnap( THREE.Math.degToRad( 15 ) );
                break;
            case 87: // W
                control.setMode( "translate" );
                break;
            case 69: // E
                control.setMode( "rotate" );
                break;
            case 82: // R
                control.setMode( "scale" );
                break;
            case 187:
            case 107: // +, =, num+
                control.setSize( control.size + 0.1 );
                break;
            case 189:
            case 109: // -, _, num-
                control.setSize( Math.max( control.size - 0.1, 0.1 ) );
                break;
            case 84:	/*t*/
                showHUD = ! showHUD;
                break;
            case 80: // P
                saveScreenshot();
                break;
        }
    });
    window.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
            case 17: // Ctrl
                control.setTranslationSnap( null );
                control.setRotationSnap( null );
                break;
        }
    });


    container.appendChild( stats.dom );

    var onWindowResize = function() {
        var height = window.innerHeight;
        var width = window.innerWidth;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize( width, height );
    };
    window.addEventListener( 'resize', onWindowResize, false );

    var render = function () {
        renderer.clear();
        renderer.render( scene, camera );
        if ( showHUD ) {
            lightShadowMapViewer.render( renderer );
        }
    };

    var animate = function() {
        requestAnimationFrame(animate);
        control.update();
        //controls.update();
        stats.begin();
        if (renderAnaglyph) {
            anaglyph.render( scene, camera );
        } else {
            render();
        }

        //render();
        stats.end();
    };

    var start = function() {
        animate();
    };

    var applyColorAltimetryMap = function() {
        var texture = material.bumpMap;

        var scratchMap = document.getElementById( 'scratchCanvas' );

        scratchMap.width = texture.image.width;
        scratchMap.height = texture.image.height;
        scratchMap.getContext( '2d' ).drawImage( texture.image, 0, 0 );

        heightToColorAltimetry(scratchMap, displacementDirection == -1);

        var colortMapTex = new THREE.Texture( scratchMap );
        colortMapTex.needsUpdate = true;
        material.map = colortMapTex;

    };

    var setTextureMap = function(tex) {
        var texture = new THREE.TextureLoader().load( tex,
            function ( texture ) {
                texture.mapping = THREE.UVMapping;
                texture.anisotropy = renderer.getMaxAnisotropy();
                var r = texture.image.height / texture.image.width;
                plane.scale.set(1, r, 1);
            }
        );
        material.map = texture;
        diffuseTexture = texture;
    };

    var setDepthMap = function(tex) {
        var texture = new THREE.TextureLoader().load( tex,
            function ( texture ) {
                if (useColorAltimetry) {
                    applyColorAltimetryMap();
                }
            }
        );

        material.bumpMap = texture;
        material.bumpScale = (bumpScale * displacementDirection);
        material.displacementMap = texture;
        texture.needsUpdate = true;

    };

    setUsingColorAltimetry = function(useColorAlt) {
        useColorAltimetry = useColorAlt;
        if (useColorAltimetry) {
            applyColorAltimetryMap();
        } else {
            material.map = diffuseTexture;
        }
    };

    var setInvertDisplacement = function(invert) {
        if (invert) {
           displacementDirection = -1;
        } else {
           displacementDirection = 1;
        }
        material.displacementScale = (displacementScale * displacementDirection);
        if (useColorAltimetry) {
            applyColorAltimetryMap();
        }
    };

    setLightIntensity = function(intensity) {
        light.intensity = intensity;
    };

    setMaterialRoughness = function(roughness) {
        material.roughness = roughness;
    };

    setMaterialMetalness = function(metalness) {
        material.metalness = metalness;
    };

    setRenderAnaglyph = function(ra) {
        renderAnaglyph = ra;
    };

    saveScreenshot = function() {
        window.open( renderer.domElement.toDataURL("image/png"), "Final");
    };

    setDisplacementScale = function(dc) {
        displacementScale = dc;
        material.displacementScale = (displacementScale * displacementDirection);
    };

    return {
        start: start,
        setTextureMap: setTextureMap,
        setDepthMap : setDepthMap,
        setInvertDisplacement : setInvertDisplacement,
        setLightIntensity : setLightIntensity,
        setMaterialRoughness: setMaterialRoughness,
        setMaterialMetalness : setMaterialMetalness,
        setRenderAnaglyph : setRenderAnaglyph,
        saveScreenshot : saveScreenshot,
        setDisplacementScale : setDisplacementScale,
        setUsingColorAltimetry : setUsingColorAltimetry
    };
};