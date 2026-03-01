export function generatePythonTemplate(name: string, className: string, description?: string): string {
  return `import appdaemon.plugins.hass.hassapi as hass
import json
import os

class ${className}(hass.Hass):
    """${description || `AppDaemon app: ${name}`}"""
    
    def initialize(self):
        """Initialize the app."""
        self.log("${className} initialized")
        
        # Configuration - edit these for your use case
        self.update_interval = 60  # seconds
        self.output_file = "/homeassistant/www/${name}_data.json"
        
        # Schedule regular updates
        self.run_every(self.update_data, self.datetime(), self.update_interval)
        
        # Run immediately on startup
        self.update_data({})
        
        # Example: Listen to state changes
        # self.listen_state(self.on_entity_change, "sensor.temperature")
    
    def update_data(self, kwargs):
        """Main method - collect and save data."""
        try:
            # Get states from Home Assistant
            # example: temp = float(self.get_state("sensor.temperature") or 0)
            
            # Process your data here
            data = {
                "last_updated": self.get_state("input_datetime.last_update") or str(self.datetime()),
                "app_name": "${name}",
                "data": {}  # Add your data here
            }
            
            # Save to file
            self.save_data(data)
            
            self.log(f"${className} data updated")
            
        except Exception as e:
            self.log(f"Error updating data: {e}", level="ERROR")
    
    def save_data(self, data):
        """Save data to JSON file."""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
            
            with open(self.output_file, "w") as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            self.log(f"Error saving data: {e}", level="ERROR")
    
    def on_entity_change(self, entity, attribute, old, new, kwargs):
        """Handle entity state changes."""
        self.log(f"{entity} changed from {old} to {new}")
        # Add your logic here
`;
}

export function generateYamlTemplate(name: string, className: string): string {
  const timestamp = new Date().toISOString();
  return `# Created: ${timestamp}
${name}:
  module: ${name}
  class: ${className}
`;
}
