import { Collection, Colors, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { CommandHelpView } from "./CommandHelpView";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export class HelpView {
    private readonly commandHelpViews: Collection<string, CommandHelpView>;
    private readonly embed: EmbedBuilder;

    constructor() {
        this.commandHelpViews = this.createCommandHelpViews();
        this.embed = this.createEmbed();
    }

    private isDirectory(item: string) {
        return fs.statSync(item).isDirectory();
    }

    private isJavascriptFile(item: string) {
        return item.endsWith(".js") && fs.statSync(item).isFile();
    }

    private createFields() {
        const categoriesPath = path.join(__dirname, "help");
        const categoriesArray = fs
            .readdirSync(categoriesPath)
            .filter((item) =>
                this.isDirectory(path.join(categoriesPath, item))
            );

        const categories = new Collection<string, string[]>();

        for (const category of categoriesArray) {
            const commandHelpViewsPath = path.join(categoriesPath, category);
            const commandNames = fs
                .readdirSync(commandHelpViewsPath)
                .map((item) => path.join(commandHelpViewsPath, item))
                .filter(this.isJavascriptFile)
                .map((commandHelpViewPath) => {
                    const importedObject = require(commandHelpViewPath);
                    const commandHelpView =
                        importedObject[Object.keys(importedObject)[0]];
                    return commandHelpView.commandName;
                });

            categories.set(category, commandNames);
        }

        return categories.map((commandNames, category) => ({
            name: `**${
                category.slice(0, 1).toUpperCase() + category.slice(1)
            }**`,
            value: commandNames
                .sort()
                .map((commandName) => `\`${commandName}\``)
                .join(", "),
        }));
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

    private createCommandHelpViews() {
        const categoriesPath = path.join(__dirname, "help");
        const categories = fs
            .readdirSync(categoriesPath)
            .filter((item) =>
                this.isDirectory(path.join(categoriesPath, item))
            );

        const commandHelpViewsArray: CommandHelpView[] = categories
            .map((category) =>
                fs
                    .readdirSync(path.join(categoriesPath, category))
                    .map((item) => path.join(categoriesPath, category, item))
                    .filter(this.isJavascriptFile)
            )
            .flat()
            .map((commandHelpViewPath) => {
                const importedObject = require(commandHelpViewPath);
                return importedObject[Object.keys(importedObject)[0]];
            });

        return commandHelpViewsArray.reduce(
            (acc, view) => acc.set(view.commandName, view),
            new Collection<string, CommandHelpView>()
        );
    }

    getEmbed(commandName?: string) {
        if (commandName === undefined) {
            return this.embed;
        } else {
            const helpPage = this.commandHelpViews.get(commandName);
            return helpPage?.getEmbed();
        }
    }
}

export const helpView = new HelpView();
