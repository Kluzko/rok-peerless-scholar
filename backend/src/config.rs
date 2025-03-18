use log::info;
use std::env;

/// Application configuration
pub struct Config {
    /// Server listen address
    pub server_addr: String,

    /// Server listen port
    pub server_port: u16,

    /// Path to static files directory
    pub static_dir: String,
}

impl Config {
    /// Load configuration from environment variables or use defaults
    pub fn from_env() -> Self {
        let server_addr = env::var("SERVER_ADDR").unwrap_or_else(|_| "127.0.0.1".to_string());

        let server_port = env::var("SERVER_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080);

        let static_dir = env::var("STATIC_DIR").unwrap_or_else(|_| "./static".to_string());

        let config = Self {
            server_addr,
            server_port,
            static_dir,
        };

        info!(
            "Loaded configuration: server={}:{}, static_dir={}",
            config.server_addr, config.server_port, config.static_dir
        );

        config
    }

    /// Get the full server address including port
    pub fn server_url(&self) -> String {
        format!("{}:{}", self.server_addr, self.server_port)
    }

    /// Initialize logging based on environment
    pub fn init_logging() {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
            .format_timestamp_millis()
            .init();

        info!("Logging initialized");
    }
}
