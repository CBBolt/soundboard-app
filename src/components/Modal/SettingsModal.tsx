import { useEffect, useState } from "react";

import GearIcon from "../../icons/GearIcon";
import Modal from "./Modal";
import SaveIcon from "../../icons/SaveIcon";
import HotkeyWrapper from "../Hotkey/HotkeyWrapper";
import HotkeyListenerModal from "./HotkeyListenerModal";
import MicIcon from "../../icons/MicIcon";
import VMDeviceDriverSelector from "../VoiceMeeter/VMDeviceDriverSelector";
import SpeakerIcon from "../../icons/SpeakerIcon";
import VMDeviceSelector from "../VoiceMeeter/VMDeviceSelector";
import WarningIcon from "../../icons/WarningIcon";
import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";
import { truncateText } from "../../lib/helpers";

type Props = {
  allHotkeys: Hotkey[];
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  show: boolean;
  onClose: () => void;
  onSave: (data: Partial<Settings>) => void;
  loadSettings: () => Settings;
};

type SettingsType = {
  settings: Settings | null;
  listeningForHotkeyStop: boolean;
  removeHotkeyStop: boolean;
  listeningForHotkeyController: boolean;
  removeHotkeyController: boolean;
  editInputDevice: boolean;
  editOutputDevice: boolean;
  editLocalOutputDevice: boolean;
};

export default function SettingsModal({
  allHotkeys,
  inputDevices,
  outputDevices,
  show,
  loadSettings,
  onClose,
  onSave,
}: Props) {
  const [config, setConfig] = useState<SettingsType>({
    settings: null,
    listeningForHotkeyStop: false,
    removeHotkeyStop: false,
    listeningForHotkeyController: false,
    removeHotkeyController: false,
    editInputDevice: false,
    editOutputDevice: false,
    editLocalOutputDevice: false,
  });

  useEffect(() => {
    const getSettings = async () => {
      const settings = await loadSettings();
      setConfig((prev) => ({ ...prev, settings }));
    };

    getSettings();
  }, [show]);

  const update =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!config.settings) return;

      const { value } = e.target;

      setConfig((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]: value,
        } as Settings,
      }));
    };

  if (!config.settings) return;

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      header={
        <>
          <GearIcon className="icon stroke" />
          <h2>Settings</h2>
        </>
      }
    >
      <>
        <div
          className="icon-btn"
          style={{ position: "absolute", top: 10, right: 50 }}
          onClick={() => onSave(config.settings!)}
        >
          <SaveIcon className="icon fill" />
        </div>

        <Modal
          isOpen={config.editInputDevice}
          onClose={() =>
            setConfig((prev) => ({ ...prev, editInputDevice: false }))
          }
          header={
            <>
              <MicIcon className="icon fill" />
              <span>Set Default Mic</span>
            </>
          }
          locked={{
            lockedCondition: !inputDevices.some(
              (d) => d.id === config.settings?.defaultInputDevice?.id,
            ),
            lockedMessage: "Device not selected",
          }}
        >
          <VMDeviceDriverSelector
            currentDevice={config.settings.defaultInputDevice}
            devices={inputDevices}
            onChange={(device) => {
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  defaultInputDevice: device,
                } as Settings,
                editInputDevice: false,
              }));
            }}
          />
        </Modal>

        <Modal
          isOpen={config.editOutputDevice}
          onClose={() =>
            setConfig((prev) => ({ ...prev, editOutputDevice: false }))
          }
          header={
            <>
              <SpeakerIcon className="icon fill" />
              <span>Set Default Output</span>
            </>
          }
          locked={{
            lockedCondition: !outputDevices.some(
              (d) => d.id === config.settings?.defaultOutputDevice?.id,
            ),
            lockedMessage: "Device not selected",
          }}
        >
          <VMDeviceDriverSelector
            currentDevice={config.settings.defaultOutputDevice}
            devices={outputDevices}
            onChange={(device) => {
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  defaultOutputDevice: device,
                } as Settings,
                editOutputDevice: false,
              }));
            }}
          />
        </Modal>

        <Modal
          isOpen={config.editLocalOutputDevice}
          onClose={() =>
            setConfig((prev) => ({ ...prev, editLocalOutputDevice: false }))
          }
          header={
            <>
              <SpeakerIcon className="icon fill" />
              <span>Set Default Local Output</span>
            </>
          }
          locked={{
            lockedCondition: !outputDevices.some(
              (d) => d.id === config.settings?.defaultLocalOutputDevice,
            ),
            lockedMessage: "Device not selected",
          }}
        >
          <VMDeviceSelector
            currentDevice={config.settings.defaultLocalOutputDevice}
            devices={outputDevices}
            onChange={(value: string) => {
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  defaultLocalOutputDevice:
                    value ?? config.settings?.defaultLocalOutputDevice,
                } as Settings,
                editLocalOutputDevice: false,
              }));
            }}
          />
        </Modal>

        <div className="flex-gap">
          <span>Base Color:</span>
          <input
            type="color"
            value={config.settings.baseColor}
            onChange={update("baseColor")}
            style={{ height: 50 }}
          />
        </div>
        <div className="flex-gap">
          <span>Stop All Hotkey:</span>
          <HotkeyWrapper
            hotkey={config.settings.stopHotkey}
            onListen={() =>
              setConfig((prev) => ({
                ...prev,
                listeningForHotkeyStop: true,
              }))
            }
            onRemove={() =>
              setConfig((prev) => ({
                ...prev,
                removeHotkeyStop: true,
              }))
            }
          />
        </div>

        <div className="flex-gap">
          <span>Controller Toggle Hotkey:</span>
          <HotkeyWrapper
            hotkey={config.settings.controllerToggleHotkey}
            onListen={() =>
              setConfig((prev) => ({
                ...prev,
                listeningForHotkeyController: true,
              }))
            }
            onRemove={() =>
              setConfig((prev) => ({
                ...prev,
                removeHotkeyController: true,
              }))
            }
          />
        </div>

        <div className="seperator" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 0.5fr",
            gap: 10,
          }}
        >
          <div className="flex-gap">
            <span>Default Mic:</span>
            <MicIcon className="icon fill" />
          </div>
          <div className="flex-gap">
            {config.settings.defaultInputDevice ? (
              <>
                <span>{`${truncateText(config.settings.defaultInputDevice.name, 15)} (${config.settings.defaultInputDevice.driver})`}</span>
                {!inputDevices.some(
                  (d) => d.id === config.settings?.defaultInputDevice?.id,
                ) && (
                  <>
                    <WarningIcon className="icon stroke fill" />
                    <span>Device not found</span>
                  </>
                )}
              </>
            ) : (
              <span>No Device</span>
            )}
          </div>
          <div className="flex-gap">
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, editInputDevice: true }))
              }
            >
              <PencilIcon className="icon fill" />
            </button>
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultInputDevice: undefined,
                  } as Settings,
                }))
              }
            >
              <TrashIcon className="icon stroke" />
            </button>
          </div>

          <div className="flex-gap">
            <span>Default Output:</span>
            <SpeakerIcon className="icon fill" />
          </div>
          {config.settings.defaultOutputDevice ? (
            <>
              <span>{`${truncateText(config.settings.defaultOutputDevice?.name, 15)} (${config.settings.defaultOutputDevice?.driver})`}</span>
              {!outputDevices.some(
                (d) => d.id === config.settings?.defaultOutputDevice?.id,
              ) && (
                <>
                  <WarningIcon className="icon stroke fill" />
                  <span>Device not found</span>
                </>
              )}
            </>
          ) : (
            <span>No Device</span>
          )}
          <div className="flex-gap">
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, editOutputDevice: true }))
              }
            >
              <PencilIcon className="icon fill" />
            </button>
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultOutputDevice: undefined,
                  } as Settings,
                }))
              }
            >
              <TrashIcon className="icon stroke" />
            </button>
          </div>

          <div className="flex-gap">
            <span>Default Local Output:</span>
            <SpeakerIcon className="icon fill" />
          </div>
          {config.settings.defaultLocalOutputDevice ? (
            <>
              <span>
                {truncateText(
                  outputDevices.find(
                    (d) => d.id === config.settings?.defaultLocalOutputDevice,
                  )?.label!,
                )}
              </span>
              {!outputDevices.some(
                (d) => d.id === config.settings?.defaultLocalOutputDevice,
              ) && (
                <>
                  <WarningIcon className="icon stroke fill" />
                  <span>Device not found</span>
                </>
              )}
            </>
          ) : (
            <span>No Device</span>
          )}
          <div className="flex-gap">
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, editLocalOutputDevice: true }))
              }
            >
              <PencilIcon className="icon fill" />
            </button>
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultLocalOutputDevice: undefined,
                  } as Settings,
                }))
              }
            >
              <TrashIcon className="icon stroke" />
            </button>
          </div>

          <HotkeyListenerModal
            allHotkeys={allHotkeys}
            remove={config.removeHotkeyStop}
            listening={config.listeningForHotkeyStop}
            onSave={(hotkey) =>
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  stopHotkey: hotkey as Hotkey,
                } as Settings,
              }))
            }
            onSaveClose={() =>
              setConfig((prev) => ({ ...prev, listeningForHotkeyStop: false }))
            }
            onRemove={() =>
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  stopHotkey: { key: "esc", shift: true } as Hotkey,
                } as Settings,
              }))
            }
            onRemoveClose={() =>
              setConfig((prev) => ({ ...prev, removeHotkeyStop: false }))
            }
          />

          <HotkeyListenerModal
            allHotkeys={allHotkeys}
            remove={config.removeHotkeyController}
            listening={config.listeningForHotkeyController}
            onSave={(hotkey) =>
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  controllerToggleHotkey: hotkey as Hotkey,
                } as Settings,
              }))
            }
            onSaveClose={() =>
              setConfig((prev) => ({
                ...prev,
                listeningForHotkeyController: false,
              }))
            }
            onRemove={() =>
              setConfig((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  controllerToggleHotkey: { key: "a", ctrl: true } as Hotkey,
                } as Settings,
              }))
            }
            onRemoveClose={() =>
              setConfig((prev) => ({ ...prev, removeHotkeyController: false }))
            }
          />
        </div>
      </>
    </Modal>
  );
}
