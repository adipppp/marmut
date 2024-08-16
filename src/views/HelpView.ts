import { Collection, Colors, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { marmut } from "../core/client";
import { CommandHelpView } from "./CommandHelpView";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export class HelpView {
    private static _instance?: HelpView;
    private readonly embed: EmbedBuilder;
    private readonly helpPages: Collection<string, CommandHelpView>;

    constructor() {
        this.embed = this.createEmbed();
        this.helpPages = this.createHelpPages();
    }

    private createFields() {
        const commands = marmut.commands;

        const categories = commands.reduce(
            (categories, command, commandName) => {
                let category = categories.get(command.category!);
                if (category === undefined) {
                    category = [];
                    categories.set(command.category!, category);
                }
                category.push(`\`${commandName}\``);
                return categories;
            },
            new Collection<string, string[]>()
        );

        const fields = categories.map((commandNames, category) => ({
            name: `**${
                category.slice(0, 1).toUpperCase() + category.slice(1)
            }**`,
            value: commandNames.sort().join(", "),
        }));

        return fields;
    }

    private createEmbed() {
        const embed = new EmbedBuilder()
            .setTitle("List of Commands")
            .setColor(Colors.Red)
            .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
            .setTimestamp();

        const fields = this.createFields();

        embed.addFields(fields);

        return embed;
    }

    private createHelpPages() {
        const helpPages = new Collection<string, CommandHelpView>();

        const helpFilesPath = path.join(__dirname, "help");
        const helpFiles = fs
            .readdirSync(helpFilesPath)
            .filter(
                (file) =>
                    file.endsWith(".js") &&
                    fs.statSync(path.join(helpFilesPath, file)).isFile()
            );

        for (const file of helpFiles) {
            const commandHelpView = require(path.join(helpFilesPath, file));
            const instance = new commandHelpView[
                Object.keys(commandHelpView)[0]
            ]();
            helpPages.set(file.slice(0, file.length - 3), instance);
        }

        return helpPages;
    }

    getEmbed(commandName: string | null) {
        if (commandName !== null) {
            const helpPage = this.helpPages.get(commandName);
            if (helpPage === undefined) {
                throw new Error(`Help page for ${commandName} not found`);
            }
            return helpPage.getEmbed();
        } else {
            return this.embed;
        }
    }

    getHelpPage(commandName: string) {
        return this.helpPages.get(commandName);
    }

    static get instance() {
        if (HelpView._instance === undefined) {
            HelpView._instance = new HelpView();
        }
        return HelpView._instance;
    }
}
