import { CommandDispatcher } from "../command-dispatcher";
import { echoCommand } from "../handlers/echo-command";
import { getTextCommand } from "../handlers/get-text-command";
import { newFileCommand } from "../handlers/new-file-command";
import { insertTextCommand } from "../handlers/insert-text-command";
import { renameTerminalCommand } from "../handlers/rename-terminal-command";
import { showMessageCommand } from '../handlers/show-message-command';
import { getTerminalName } from "../handlers/get-terminal-name-command";

const dispatcher = new CommandDispatcher();
dispatcher.regist(echoCommand);
dispatcher.regist(getTextCommand);
dispatcher.regist(newFileCommand);
dispatcher.regist(insertTextCommand);
dispatcher.regist(renameTerminalCommand);
dispatcher.regist(showMessageCommand);
dispatcher.regist(getTerminalName);

export default dispatcher;
