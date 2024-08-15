import { Collection, Colors, EmbedBuilder } from "discord.js";
import { marmut } from "../core/client";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export class HelpView {
    private readonly embed: EmbedBuilder;
    private static _instance?: HelpView;

    constructor() {
        this.embed = this.createEmbed();
    }

    private createEmbed() {
        const embed = new EmbedBuilder()
            .setTitle("List of Commands")
            .setColor(Colors.Red)
            .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
            .setTimestamp();

        const commands = marmut.commands;
        const categories = new Collection<string, string[]>();

        for (const [commandName, command] of commands) {
            const category = categories.get(command.category!);

            if (category === undefined) {
                categories.set(command.category!, []);
            } else {
                category.push(`\`${commandName}\``);
            }
        }

        for (const [category, commandNames] of categories) {
            embed.addFields({
                name: `**${
                    category.slice(0, 1).toUpperCase() + category.slice(1)
                }**`,
                value: commandNames.join(", "),
            });
        }

        return embed;
    }

    getEmbed() {
        return this.embed;
    }

    static get instance() {
        if (HelpView._instance === undefined) {
            HelpView._instance = new HelpView();
        }
        return HelpView._instance;
    }
}
