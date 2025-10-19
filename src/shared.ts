export type ChatMessage = {
	id: string;
	content: string;
	user: string;
	role: "user" | "assistant";
	timestamp: number;
};

export type Message =
	| {
		type: "add";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
		timestamp: number;
	}
	| {
		type: "update";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
		timestamp: number;
	}
	| {
		type: "all";
		messages: ChatMessage[];
	};

// export names as an array of 26 fixed user names in the format "user000"
export const names = Array.from({ length: 26 }, (_, i) => {
	return `user${i.toString().padStart(3, "0")}`;
});
