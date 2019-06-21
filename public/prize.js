//THIS IS AN ARRAY WHERE IT WILL GENERATE RANDOM MESSAGE AT THE END OF THE GAME IF THE USER CLICK THE VIEW MYSTERY PRIZE
var prize = [
	"Mystery Prize Item: Bag of Lollipop",
	"Mystery Prize Item: IPhone X",
	"Mystery Prize Item: Razer Chroma Keyboard",
	"Mystery Prize Item: Virtual Hugs",
	"Mystery Prize Item: Virtual Kiss",
	"Mystery Prize Item: Cadburry Chocolates",
	"Mystery Prize Item: Borken Heart",
	];
let mysteryPrize = "";

mysteryPrize = prize[Math.floor(Math.random() * prize.length)];
