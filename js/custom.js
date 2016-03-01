var canvas;
var gl;
var points = [];
var triangleSize = 1;
var rotationAngle;
var vertices;

$(document).ready(function(){
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    setupVars();
    setupUIchangeListeners();

    performTessellation(vertices[0], vertices[1], vertices[2], getTessellationGrade());

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    drawArrays();
});

function setupVars(){
    var sideLength = 1.4 * triangleSize;
    vertices = [
        vec2( 0,sideLength/Math.sqrt(3)), // left-down corner
        vec2( -sideLength/2,  -sideLength/(2*Math.sqrt(3))),  // center-up corner
        vec2( sideLength/2,  -sideLength/(2*Math.sqrt(3)))
    ]; 

    rotationAngle = $("#rotationAngle").val() * Math.PI / 180;
}

function setupUIchangeListeners(){
    // Setup Angle Rotation Listener
    $("#rotationAngle").change("input", function(e){
        $("#rotationAngleOutput").text(this.value + "°");
        rotationAngle = this.value * Math.PI / 180;
        redraw();
    }, false);

    // Setup Wireframe/Solid Fill Listener
    $('input[type=radio][name=view]').change(redraw);

    // Tessellation Grade Selector
    $("#tessellationGrade").change("input", function() {
        $("#tessellationGradeOutput").text(this.value);
        redraw();
    }, false);

    $("#triangleSize").change("input", function(){
        $("#triangleSizeOutput").text(Math.floor(this.value * 100) + "%");
        triangleSize = this.value;
        setupVars();
        redraw();
    }, false);
}


function twistVector(vector){
    var x = vector[0], y = vector[1], dist = Math.sqrt(x * x + y * y),
        sinAng = Math.sin(dist*rotationAngle),
        cosAng = Math.cos(dist*rotationAngle);
        return [x * cosAng - y * sinAng, x * sinAng + y * cosAng];
}

function triangle (a, b, c){
    a = twistVector(a), b = twistVector(b), c = twistVector(c);
    if(showWireframe() === false){
        points.push(a, b, c);
    } else {
        points.push(a, b);
        points.push(b, c);
        points.push(a, c);
    }
}

function performTessellation(a, b, c, count){
    //base case
    if(count === 0){ triangle(a,b,c); return;}

    //calculate new sides
    var ab = mix( a, b, 0.5 );
    var ac = mix( a, c, 0.5 );
    var bc = mix( b, c, 0.5 );

    //recursive calls
    --count;
    performTessellation(ac, bc, ab, count);
    performTessellation(a, ab, ac, count);
    performTessellation(b, bc, ab, count);
    performTessellation(c, ac, bc, count);
}

function redraw(){
    points = [];
    performTessellation(vertices[0], vertices[1], vertices[2], getTessellationGrade());
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    drawArrays();
}

function showWireframe(){
    var checkedRadioId = $("input[type=radio]:checked").attr("id");
    return checkedRadioId === "showWireframe";
}

function getTessellationGrade(){
    return $("#tessellationGrade").val();
}

function drawArrays() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    if(showWireframe() === false){
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
    else {
        gl.drawArrays( gl.LINES, 0, points.length );   
    }
}