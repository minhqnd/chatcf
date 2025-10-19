export type ChatMessage = {
	id: string;
	content: string;
	user: string;
	role: "user" | "assistant";
};

export type Message =
	| {
		type: "add";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
	}
	| {
		type: "update";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
	}
	| {
		type: "all";
		messages: ChatMessage[];
	};

// export names as an array of 26 randomized user names in the format "user000"
export const names = Array.from({ length: 26 }, () => {
	const n = Math.floor(Math.random() * 1000);
	return `user${n.toString().padStart(3, "0")}`;
});
