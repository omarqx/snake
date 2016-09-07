export default class CanvasPosition {
    constructor(public x: number = 0, public y: number = 0) {

    }

    add(point: CanvasPosition): CanvasPosition {
        this.x += point.x;
        this.y += point.y;
        return this;
    }

    clone(): CanvasPosition {
        return new CanvasPosition(this.x, this.y);
    }

    equal(point: CanvasPosition): boolean {
        return point.x === this.x && point.y === this.y;
    }

    subtract(point: CanvasPosition): CanvasPosition {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    }
}

interface IComponent {
    position: CanvasPosition;
    render();
    dispose();
}

interface GameConfig {
    width?: number;
    height?: number;
    blockSize?: number;
    buildWalls?: boolean;
}

const enum Directions {
    Up = 38,
    Down = 40,
    Left = 37,
    Right = 39
}
abstract class Composition implements IComponent {
    components: IComponent[];
    /**
     *
     */
    constructor(public position?: CanvasPosition) {
        this.components = [];
    }

    addComponent(component: IComponent) {
        this.components.push(component);
    }

    deleteComponent(component: IComponent) {
        this.components.slice(this.components.indexOf(component));
    }

    render() {
        this.components.forEach((fe) => fe.render());
    }

    intersect(point: CanvasPosition): boolean {
        return !this.components.every((e) => !e.position.equal(point));
    }

    dispose() {
        this.components.forEach((fe) => fe.dispose());
    }
}
class deadZone implements IComponent {
    /**
     *
     */
    constructor(public position: CanvasPosition, public canvas: GameCanvas) {

    }
    render() {
        this.canvas.context.fillStyle = "black";
        this.canvas.context.fillRect(this.position.x, this.position.y, this.canvas.blockSize, this.canvas.blockSize);
    }
    dispose() {

    }
}
class foodZone implements IComponent {
    /**
     *
     */
    constructor(public position: CanvasPosition, public canvas: GameCanvas) {

    }
    render() {
        this.canvas.context.fillStyle = "green";
        this.canvas.context.fillRect(this.position.x, this.position.y, this.canvas.blockSize, this.canvas.blockSize);
    }
    dispose() {

    }
}
class snakeBody implements IComponent {
    constructor(public position: CanvasPosition, public canvas: GameCanvas) {

    }

    render() {
        this.canvas.context.fillStyle = "blue";
        this.canvas.context.fillRect(this.position.x, this.position.y, this.canvas.blockSize, this.canvas.blockSize);
    }

    dispose() {

    }
}
class snake extends Composition {
    size: number = 1;
    queue: CanvasPosition[] = [];
    head: snakeBody;
    /**
     *
     */
    constructor(public position: CanvasPosition, public canvas: GameCanvas) {
        super();
        this.head = new snakeBody(position.clone(), this.canvas);
    }

    grow() {
        this.size++;
    }

    render() {
        super.render();
        this.head.render();
    }

    move(diff: CanvasPosition) {
        this.addComponent(new snakeBody(this.position.clone(), this.canvas));
        this.position.add(diff);
        this.head = new snakeBody(this.position.clone(), this.canvas);
        if (this.components.length + 1 > this.size)
            this.components.shift();
    }
}
class GameCanvas {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    interval: number;
    animation: number;
    blockSize: number = 10;
    buildWalls: boolean = true;
    width: number = 500;
    height: number = 500;
    motion: CanvasPosition = new CanvasPosition();
    obstructions: IComponent[] = [];
    food: foodZone = null;
    snake: snake;
    _arrowHandler;
    constructor(public config?: GameConfig) {
        this.canvas = document.createElement("canvas");
        if (config !== undefined) {
            if (config.blockSize !== undefined)
                this.blockSize = config.blockSize;
            if (config.width !== undefined)
                this.width = config.width;
            if (config.height !== undefined)
                this.height = config.height;
            if (config.buildWalls !== undefined)
                this.buildWalls = config.buildWalls;
        }
    }

    setupHandlers() {
        this._arrowHandler = null;

        this._arrowHandler = (event: KeyboardEvent) => {
            switch (event.keyCode) {
                case Directions.Down: this.motion = new CanvasPosition(0, this.blockSize);
                    break;
                case Directions.Left: this.motion = new CanvasPosition(-this.blockSize, 0);
                    break;
                case Directions.Right: this.motion = new CanvasPosition(this.blockSize, 0);
                    break;
                case Directions.Up: this.motion = new CanvasPosition(0, -this.blockSize);
                    break;
                default:
                    break;
            }
            event.stopPropagation();
        };

        document.addEventListener('keydown', this._arrowHandler, true);
    }

    _teardownHandlers() {
        document.removeEventListener('keydown', this._arrowHandler, true);
        this._arrowHandler = null;
    }


    start() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        if (this.buildWalls === true) {
            this.obstructions.push(new wall(new CanvasPosition(), this.width / this.blockSize, Directions.Right, this));
            this.obstructions.push(new wall(new CanvasPosition(0, this.height - this.blockSize), this.width / this.blockSize, Directions.Right, this));
            this.obstructions.push(new wall(new CanvasPosition(this.width - this.blockSize, 0), this.height / this.blockSize, Directions.Down, this));
            this.obstructions.push(new wall(new CanvasPosition(), this.height / this.blockSize, Directions.Down, this));
        }

        this.context = this.canvas.getContext("2d");
        this.setupHandlers();
        document.body.appendChild(this.canvas);
        this.snake = new snake(new CanvasPosition(this.blockSize, this.blockSize), this);
        this.food = this.newFood();

        this.animation = requestAnimationFrame(() => this.draw.apply(this));
        this.interval = setInterval(() => this.gameLoop.apply(this), (1000 / 60) * 5);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        this.clear();
        this.obstructions.forEach((fe) => fe.render());
        this.snake.render();
        this.food.render();
        this.animation = requestAnimationFrame(() => this.draw.apply(this));
    }

    newFood() {
        return new foodZone(new CanvasPosition(this.getRandomArbitrary(this.blockSize, this.width - this.blockSize), this.getRandomArbitrary(this.blockSize, this.height - this.blockSize)), this);
    }
    gameLoop() {
        if (this.food.position.equal(this.snake.position)) {
            this.food = this.newFood();
            this.snake.grow();
        }
        if (this.snake)
            this.snake.move(this.motion);

        this.obstructions.forEach((obs) => {
            if (obs instanceof Composition && obs.intersect(this.snake.position))
                this.endGame();
        });

        if (this.snake.intersect(this.snake.position))
            this.endGame();

    }
    endGame() {
        clearInterval(this.interval);
        cancelAnimationFrame(this.animation);
        this._teardownHandlers();
        this.context.font = "50px 'Lucida Sans Unicode'";
        this.context.fillStyle = "red";
        this.context.textAlign = "center";
        this.context.fillText("GAME OVER!", (this.width / 2), (this.height / 2));
    }

    getRandomArbitrary(min, max) {
        let original = ~~(Math.random() * (max - min) + min);
        return original - original % this.blockSize;
    }
}
class wall extends Composition {
    constructor(postion: CanvasPosition, public length: number, public direction: Directions, public canvas: GameCanvas) {
        super();
        switch (direction) {
            case Directions.Down: for (var index = 0; index < length; index++)
                this.addComponent(new deadZone(new CanvasPosition(postion.x, postion.y + (index * this.canvas.blockSize)), canvas));
                break;
            case Directions.Left: for (var index = 0; index < length; index++)
                this.addComponent(new deadZone(new CanvasPosition(postion.x + (index * -this.canvas.blockSize), postion.y), canvas));
                break;
            case Directions.Right: for (var index = 0; index < length; index++)
                this.addComponent(new deadZone(new CanvasPosition(postion.x + (index * this.canvas.blockSize), postion.y), canvas));
                break;
            case Directions.Up: for (var index = 0; index < length; index++)
                this.addComponent(new deadZone(new CanvasPosition(postion.x, postion.y + (index * -this.canvas.blockSize)), canvas));
                break;
            default:
                break;
        }
    }
}

let snakeGame = new GameCanvas();
snakeGame.start();