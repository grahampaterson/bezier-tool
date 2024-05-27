class Point {
    x;
    y;
    
    constructor(x,y) {
        this.x = x
        this.y = y
    }
}

function centerInViewport(node) {
    let center = figma.viewport.center
    let x = Math.round(center.x)
    let y = Math.round(center.y)

    node.x = x - (node.width / 2)
    node.y = y - (node.height / 2)
}

function drawPath(x1, y1, x2, y2, width=100, height=100) {
    let vector = figma.createVector()
    const vectorNetwork = {
        vertices : [
            {x : 0, y: width},
            {x : height, y : 0}
        ],

        segments: [
            {
              start: 0,
              tangentStart: { 
                  x: width * x1, 
                  y: -(height * y1) 
              },
              end: 1,
              tangentEnd: { 
                  x: -width * (1 - x2), 
                  y: height-(height * y2)
              },
            }
        ],

    }

    vector.setVectorNetworkAsync(vectorNetwork)
    return vector
}

async function drawCurve(x1, y1, x2, y2, width=100, height=100) {
    // x1 > 0
    // x2 < 1

    // create rectangle
    let rectangle = createRectangle(width, height)

    // create handles
    const handles = createHandles(x1,y1,x2,y2,width,height)


    // create path
    let vector = drawPath(x1, y1, x2, y2, width, height)

    // path endpoints
    const circles = [drawCircle(0, height, 4), drawCircle(width, 0, 4)]
    let line = figma.group([vector, ...circles], figma.currentPage)
    line.name = "path"

    // create label
    let text = await createLabel(`(${x1}, ${y1}, ${x2}, ${y2})`)
    text.y = height + 8

    // Group and reposition in viewport
    const group = figma.group([...handles, line, text, rectangle], figma.currentPage)
    group.name = "graph"

    return group
}

function drawCircle(x, y, d, colour='hsl(200 15% 1%)') {
    const paint = figma.util.solidPaint(colour)
    
    let circle = figma.createEllipse()
    
    circle.resize(d,d)
    circle.x = x - d/2
    circle.y = y - d/2
    circle.fills = [paint]

    return circle
}

function createRectangle(width, height) {
    const paint = figma.util.solidPaint('hsl(200 15% 90%)')
    
    let rectangle = figma.createRectangle()
    rectangle.resize(width, height)
    rectangle.fills = []
    rectangle.strokes = [paint]

    rectangle.name = "background"
    rectangle.strokeTopWeight = 0
    rectangle.strokeRightWeight = 0
    rectangle.strokeLeftWeight = 1
    rectangle.strokeBottomWeight = 1
    rectangle.strokeAlign = 'CENTER'

    let rectangle2 = figma.createRectangle()
    rectangle2.resize(width, height)
    rectangle2.fills = []
    rectangle2.strokes = [paint]
    
    rectangle2.name = "background"
    rectangle2.strokeTopWeight = 1
    rectangle2.strokeRightWeight = 1
    rectangle2.strokeLeftWeight = 0
    rectangle2.strokeBottomWeight = 0
    rectangle2.dashPattern = [10, 5]
    rectangle2.strokeAlign = 'CENTER'

    return figma.group([rectangle, rectangle2], figma.currentPage)
}

function createHandles(x1, y1, x2, y2, width, height) {
    const colour = 'hsl(200 15% 75%)'
    const handleSize = 4
    
    const paint = figma.util.solidPaint(colour)
    const strokeCap = "ARROW_LINES"

    let handle1 = figma.createVector()
    handle1.setVectorNetworkAsync({
        vertices : [
            {x : 0, y : width},
            {x : width * x1, y : height-(height * y1)}
        ],
        segments: [
            {
                start: 0,
                end: 1,
            }
        ]
    })

    let handle2 = figma.createVector()
    handle2.setVectorNetworkAsync({
        vertices : [
            {x : height, y : 0},
            {x : width-(width * (1 - x2)), y : height-(height * y2)}
        ],
        segments: [
            {
                start: 0,
                end: 1,
            }
        ]
    })

    handle1.strokes = [paint]
    handle2.strokes = [paint]

    const circles = [
        drawCircle(width * x1, height-(height * y1), handleSize, colour), 
        drawCircle(width-(width * (1 - x2)), height-(height * y2), handleSize, colour)
    ]

    let h1 = figma.group([handle1, circles[0]], figma.currentPage)
    h1.name = "start-handle"

    let h2 = figma.group([handle2, circles[1]], figma.currentPage)
    h2.name = "end-handle"

    return [h1, h2]
}

async function createLabel(text) {
    let textNode = figma.createText()
    await figma.loadFontAsync(textNode.fontName)
    textNode.characters = text
    return textNode
}

function bezier(p0, p1, p2, p3, t) {
    let p4 = lerp(p0, p1, t)
    let p5 = lerp(p1, p2, t)
    let p6 = lerp(p2, p3, t)

    let p7 = lerp(p4, p5, t)
    let p8 = lerp(p5, p6, t)

    return (lerp(p7, p8, t))
}  

function lerp(p1, p2, t) {
    const lenX = p2.x - p1.x
    const lenY = p2.y - p1.y

    const distX = lenX * t
    const distY = lenY * t

    return (new Point(p1.x + distX, p1.y + distY))
}

function drawAllPoints(p1,p2,p3,p4, steps=20, circleSize=4) {
    const allCircles = []
    for (let i = 0; i <= steps; i ++) {
        let position = bezier(p1, p2, p3, p4, i/steps)
        let ellipse = drawCircle(position.x, position.y, circleSize, 'hsla(200, 80%, 50%, 0.5)')
        allCircles.push(ellipse)
    }
    let group = figma.group(allCircles, figma.currentPage)
    group.name = "distribution"
    
    return group
}

// This function draws a cubic bezier from bottom left to top right (ie flipped)
function drawCubicBezier(x1, y1, x2, y2, scale=100) {
    return drawAllPoints(new Point(0,100), new Point(x1 * scale, y2 * scale), new Point(x2 * scale, y1 * scale), new Point(100,0))
}

// This function draws a cubic bezier from bottom left to top right (ie flipped)
function drawFlatCubicBezier(x1, y1, x2, y2, scale=100) {
    return drawAllPoints(new Point(0,0), new Point(x1 * scale, 0), new Point(x2 * scale, 0), new Point(scale,0))
}

async function pathAndDistribution(x1, y1, x2, y2, scale=100) {
    let curve = await drawCurve(x1, y1, x2, y2, scale, scale)
    let distribution = drawFlatCubicBezier(x1, y1, x2, y2, scale)
    const frame = figma.createFrame()
    
    frame.layoutMode = 'VERTICAL';
    frame.layoutSizingHorizontal = "HUG"
    frame.layoutSizingVertical = "HUG"
    frame.itemSpacing = 8;
    frame.name = `(${x1}, ${y1}, ${x2}, ${y2})`
    frame.fills = []
    // debugger
    frame.appendChild(curve)
    frame.appendChild(distribution)

    centerInViewport(frame)
}
