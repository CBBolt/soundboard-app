import type { TutorialFlow } from "../_types/tutorial";

const createFlow = (id: string, ...flows: TutorialFlow[]): TutorialFlow => ({
  id,
  steps: flows.flatMap((flow) => flow.steps),
});

export const sounds: Record<string, TutorialFlow> = {
  sounds: {
    id: "sounds",
    steps: [
      {
        id: "1",
        text: "Let's go ahead and add your first sound!",
      },
      {
        id: "2",
        text: "You can find that here in the sidebar",
        placement: "right",
        target: "[data-tour='sidebar-button']",
        advance: "click-target",
        condition: [
          { type: "sidebar-closed" },
          { type: "sidebar-item", item: "SOUND" },
        ],
      },
      {
        id: "3",
        text: "Go to Sounds",
        placement: "right",
        target: "[data-tour='SOUND-button']",
        advance: "click-target",
        condition: [{ type: "sidebar-item", item: "SOUND" }],
      },
      {
        id: "4",
        text: "Click here to add a sound",
        placement: "right",
        target: "[data-tour='add-sound']",
        advance: "click-target",
      },
      {
        id: "5",
        text: "Here you can add a sound via file, link, or record your own!",
        target: "[data-tour='add-sound-modal']",
        advance: "click-target",
      },
    ],
  },
};

export const boards: Record<string, TutorialFlow> = {
  boards: {
    id: "boards",
    steps: [
      {
        id: "1",
        text: "Once you have some sounds and have customized them, it's time to setup a board!",
      },
      {
        id: "2",
        text: "We'll go to the boards section",
        placement: "right",
        target: "[data-tour='sidebar-button']",
        advance: "click-target",
        condition: [
          { type: "sidebar-closed" },
          { type: "sidebar-item", item: "BOARD" },
        ],
      },
      {
        id: "3",
        text: "Go to Boards",
        placement: "right",
        target: "[data-tour='BOARD-button']",
        advance: "click-target",
        condition: [{ type: "sidebar-item", item: "BOARD" }],
      },
      {
        id: "4",
        text: "Here you can add boards and edit the layout of the sounds",
      },
      {
        id: "5",
        text: "For fun, let's make a new board",
        placement: "left",
        target: "[data-tour='add-board']",
        advance: "click-target",
        condition: [{ type: "boards-created" }],
      },
      {
        id: "6",
        text: "Here you can rename the board, select the board layout, and load the board to the overlay controller",
        target: "[data-tour='board-edit-bar']",
      },
      {
        id: "7",
        text: "Click here to add tiles",
        target: "[data-tour='board-add-sound']",
        placement: "right",
        advance: "click-target",
      },
      {
        id: "8",
        placement: "top",
        text: "Click the plus icon on a tile to add a sound, or hover to remove it",
      },
      {
        id: "9",
        placement: "top",
        text: "Tiles can also be swapped by dragging and dropping them",
      },
    ],
  },
};

export const vmSetup: Record<string, TutorialFlow> = {
  vmSetup: {
    id: "vmSetup",
    steps: [
      {
        id: "1",
        text: "This app integrates with VoiceMeeter for playing audio and sounds through the same mic",
      },
      {
        id: "2",
        text: "Go to Help",
        target: "[data-tour='help']",
        advance: "click-target",
      },
      {
        id: "3",
        text: "Go to the help button",
        target: "[data-tour='help-btn']",
        advance: "click-target",
      },
      {
        id: "4",
        text: "This has helpful information and you can view other tutorials!",
        placement: "top",
        target: "[data-tour='help-menu']",
      },
      {
        id: "5",
        text: "But we'll go through the setup first",
        target: "[data-tour='vm-setup-btn']",
        advance: "click-target",
      },
      {
        id: "6",
        text: "Please follow the below instructions and open the app after a restart!",
      },
    ],
  },
};

export const vmUse: Record<string, TutorialFlow> = {
  vmUse: {
    id: "vmUse",
    steps: [
      {
        id: "1",
        text: "Since this app uses VoiceMeeter, you can easily edit the settings in the app for convience",
      },
      {
        id: "2",
        text: "You can find that here in the sidebar",
        placement: "right",
        target: "[data-tour='sidebar-button']",
        advance: "click-target",
        condition: [{ type: "sidebar-closed" }],
      },
      {
        id: "3",
        text: "The panel is right here",
        target: "[data-tour='vm-panel']",
        placement: "right",
      },
      {
        id: "4",
        text: "This button here let's you toggle between local and VoiceMeeter. Click it to toggle it",
        placement: "right",
        target: "[data-tour='vm-toggle']",
        advance: "click-target",
        condition: [{ type: "vm-toggled" }],
      },
      {
        id: "5",
        text: "You can now see this panel which lets you mute devices, toggle monitoring, and seeing which devices are selected",
        placement: "right",
        target: "[data-tour='vm-panel-devices']",
      },
      {
        id: "6",
        text: "Click here to see more settings",
        placement: "right",
        target: "[data-tour='vm-panel-settings']",
        advance: "click-target",
      },
      {
        id: "7",
        text: "Here you can swap devices, change volume, mute, and montior",
        placement: "top",
        target: "[data-tour='vm-panel-modal']",
      },
      {
        id: "8",
        text: "A note on WDM / MME: You can toggle that by clicking the button to send to VoiceMeeter. More information is in the help section",
        placement: "left",
        target: "[data-tour='vm-modal-help']",
        advance: "click-target",
      },
    ],
  },
};

export const tags: Record<string, TutorialFlow> = {
  tags: {
    id: "tags",
    steps: [
      {
        id: "1",
        text: "Tags can be used to better organize sounds and are super simple",
      },
      {
        id: "2",
        text: "You can find that here in the sidebar",
        placement: "right",
        target: "[data-tour='sidebar-button']",
        advance: "click-target",
        condition: [
          { type: "sidebar-closed" },
          { type: "sidebar-item", item: "TAG" },
        ],
      },
      {
        id: "3",
        text: "Go to Tags",
        placement: "right",
        target: "[data-tour='TAG-button']",
        advance: "click-target",
        condition: [{ type: "sidebar-item", item: "TAG" }],
      },
      {
        id: "4",
        text: "Here you can add sounds with a name and color",
      },
      {
        id: "5",
        text: "Once you have tags, they can be added to sounds!",
      },
    ],
  },
};

export const overlay: Record<string, TutorialFlow> = {
  overlay: {
    id: "overlay",
    steps: [
      {
        id: "1",
        text: "The controller overlay is useful for allowing you to trigger sounds over games or other windows",
      },
      {
        id: "2",
        text: "Here is the toggle for the overlay",
        placement: "bottom",
        target: "[data-tour='overlay-controller']",
        advance: "click-target",
      },
      {
        id: "3",
        text: "To change the controller content, go to a board and click the load button",
      },
      {
        id: "4",
        text: "This can also be toggled via the hotkey set in settings",
      },
    ],
  },
};

export const baseTutorial = {
  baseTutorial: createFlow(
    "baseTutorial",
    { id: "welcome", steps: [{ id: "1", text: "Welcome to the soundboard!" }] },
    sounds.sounds,
    boards.boards,
    overlay.overlay,
    tags.tags,
    vmSetup.vmSetup,
  ),
};

export const vmTutorial = {
  vmTutorial: createFlow(
    "vmTutorial",
    {
      id: "restart",
      steps: [
        {
          id: "1",
          text: "Now that you have VoiceMeeter & VB Cable installed, let's go over how to use it in this app",
        },
      ],
    },
    vmUse.vmUse,
  ),
};
