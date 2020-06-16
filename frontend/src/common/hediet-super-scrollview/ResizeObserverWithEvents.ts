import { EventEmitter } from "@hediet/std/events";

export class ResizeObserverWithEvents {
	private readonly resizeEventEmitter = new EventEmitter();
	public readonly onResize = this.resizeEventEmitter.asEvent();

	private readonly resizeObserver = new ResizeObserver(() =>
		this.handleResize(),
	);

	private handleResize(): void {
		this.resizeEventEmitter.emit();
	}

	public observe(target: Element): void {
		this.resizeObserver.observe(target);
	}
}
