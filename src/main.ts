interface GameConfig {
    width?: number;
    height?: number;
    blockSize?: number;
    buildWalls?: boolean;
}

class CanvasPosition {
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

    subtract(point: CanvasPosition): CanvasPosition {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    }
}

interface IComponent {
    render();
    dispose();
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
    constructor() {
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
        this.canvas.context.fillStyle = "red";
        this.canvas.context.fillRect(this.position.x, this.position.y, this.canvas.blockSize, this.canvas.blockSize);
    }
    dispose() {

    }
}
class snake implements IComponent {
    /**
     *
     */
    constructor(public position: CanvasPosition, public canvas: GameCanvas) {

    }

    move(diff: CanvasPosition) {
        this.position.add(diff);
    }

    render() {
        this.canvas.context.fillStyle = "blue";
        this.canvas.context.fillRect(this.position.x, this.position.y, this.canvas.blockSize, this.canvas.blockSize);
    }

    dispose() {

    }
}
class GameCanvas {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    interval: number;
    blockSize: number = 5;
    buildWalls: boolean = true;
    width: number = 480;
    height: number = 270;
    motion: CanvasPosition = new CanvasPosition();
    obstructions: IComponent[] = [];
    edibles: IComponent[] = [];
    snake: snake;
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
        document.addEventListener('keydown', (event: KeyboardEvent) => {
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
        });
        document.body.appendChild(this.canvas);
        this.snake = new snake(new CanvasPosition(this.width / 10, this.height / 10), this);
        this.interval = setInterval(() => this.updateGameArea.apply(this), 50);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateGameArea() {
        this.clear();
        if (this.snake)
            this.snake.position.add(this.motion);
        this.obstructions.forEach((fe) => fe.render());
        this.snake.render();
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