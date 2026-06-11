mod voicemeeter;

use serde::{Deserialize, Serialize};
use std::io::{self, BufRead};
use std::time::Duration;
use cpal::traits::{DeviceTrait, HostTrait};

use voicemeeter::*;

#[derive(Debug, Deserialize)]
struct Command {
    cmd: String,
    param: Option<String>,
    value: Option<f32>,
    string_value: Option<String>,
}

#[derive(Debug, Serialize)]
struct Response {
    success: bool,
    message: String,
    float_value: Option<f32>,
    string_value: Option<String>,
}

fn send_response(response: Response) {
    let json = serde_json::to_string(&response)
        .expect("Failed to serialize response");

    println!("{}", json);
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    std::thread::sleep(Duration::from_secs(5));

    let vm = VoicemeeterSession::new(Voicemeeter::new()?)?;

    let stdin = io::stdin();

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(line) => line,
            Err(err) => {
                send_response(Response {
                    success: false,
                    message: format!(
                        "stdin error: {}",
                        err
                    ),
                    float_value: None,
                    string_value: None,
                });

                continue;
            }
        };

        let command: Command =
            match serde_json::from_str(&line) {
                Ok(cmd) => cmd,
                Err(err) => {
                    send_response(Response {
                        success: false,
                        message: format!(
                            "invalid json: {}",
                            err
                        ),
                        float_value: None,
                        string_value: None,
                    });

                    continue;
                }
            };

        match command.cmd.as_str() {
            "logout" => {
                match vm.logout() {
                    Ok(_) => send_response(Response {
                        success: true,
                        message: "logged out".into(),
                        float_value: None,
                        string_value: None,
                    }),

                    Err(err) => send_response(Response {
                        success: false,
                        message: err,
                        float_value: None,
                        string_value: None,
                    }),
                }
            }

            "set_float" => {
                let param = command.param.unwrap_or_default();

                let value = match command.value {
                    Some(v) => v,
                    None => {
                        send_response(Response {
                            success: false,
                            message: "missing float value".into(),
                            float_value: None,
                            string_value: None,
                        });

                        continue;
                    }
                };

                match vm.set_parameter_float(&param, value) {
                    Ok(_) => send_response(Response {
                        success: true,
                        message: format!("{} set to {}", param, value),
                        float_value: Some(value),
                        string_value: None,
                    }),

                    Err(err) => send_response(Response {
                        success: false,
                        message: err,
                        float_value: None,
                        string_value: None,
                    }),
                }
            }

            "set_string" => {
                let param = command.param.unwrap_or_default();

                let value = match command.string_value {
                    Some(v) => v,
                    None => {
                        send_response(Response {
                            success: false,
                            message: "missing string value".into(),
                            float_value: None,
                            string_value: None,
                        });

                        continue;
                    }
                };

                match vm.set_parameter_string(&param, &value) {
                    Ok(_) => send_response(Response {
                        success: true,
                        message: format!("{} set", param),
                        float_value: None,
                        string_value: Some(value),
                    }),

                    Err(err) => send_response(Response {
                        success: false,
                        message: err,
                        float_value: None,
                        string_value: None,
                    }),
                }
            }

            "get_float" => {
                let param = command.param.unwrap_or_default();

                match vm.get_parameter_float(&param) {
                    Ok(value) => send_response(Response {
                        success: true,
                        message: format!("{} read", param),
                        float_value: Some(value),
                        string_value: None,
                    }),

                    Err(err) => send_response(Response {
                        success: false,
                        message: err,
                        float_value: None,
                        string_value: None,
                    }),
                }
            }

            "get_string" => {
                let param = command.param.unwrap_or_default();

                match vm.get_parameter_string(&param) {
                    Ok(value) => send_response(Response {
                        success: true,
                        message: format!("{} read", param),
                        float_value: None,
                        string_value: Some(value),
                    }),

                    Err(err) => send_response(Response {
                        success: false,
                        message: err,
                        float_value: None,
                        string_value: None,
                    }),
                }
            }

            "input_devices" => {
                let host = cpal::default_host();

                match host.input_devices() {
                    Ok(devices) => {
                        let names: Vec<String> = devices
                            .filter_map(|d| d.name().ok())
                            .collect();

                        send_response(Response {
                            success: true,
                            message: format!("Found {} input devices", names.len()),
                            float_value: None,
                            string_value: Some(names.join(", ")),
                        });
                    }

                    Err(err) => {
                        send_response(Response {
                            success: false,
                            message: err.to_string(),
                            float_value: None,
                            string_value: None,
                        });
                    }
                }
            }

            "output_devices" => {
                let host = cpal::default_host();

                match host.output_devices() {
                    Ok(devices) => {
                        let names: Vec<String> = devices
                            .filter_map(|d| d.name().ok())
                            .collect();

                        send_response(Response {
                            success: true,
                            message: format!("Found {} output devices", names.len()),
                            float_value: None,
                            string_value: Some(names.join(", ")),
                        });
                    }

                    Err(err) => {
                        send_response(Response {
                            success: false,
                            message: err.to_string(),
                            float_value: None,
                            string_value: None,
                        });
                    }
                }
            }

            _ => {
                send_response(Response {
                    success: false,
                    message: format!(
                        "unknown command: {}",
                        command.cmd
                    ),
                    float_value: None,
                    string_value: None,
                });
            }
        }
    }

    Ok(())
}