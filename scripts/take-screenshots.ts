import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

async function takeScreenshots() {
  console.log('Taking screenshots for README...');
  
  // Ensure screenshots directory exists
  const screenshotDir = path.join(process.cwd(), 'docs', 'screenshots');
  if (!existsSync(screenshotDir)) {
    mkdirSync(screenshotDir, { recursive: true });
  }
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for UI to settle
    
    // Screenshot 1: Full IDE interface
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-main-interface.png'),
      fullPage: false 
    });
    console.log('✓ Screenshot 1: Main interface');
    
    // Screenshot 2: Sidebar with app list
    // The sidebar should already be visible
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-sidebar.png'),
      clip: { x: 0, y: 0, width: 280, height: 900 }
    });
    console.log('✓ Screenshot 2: Sidebar');
    
    // Screenshot 3: Editor with Python code
    // Click on the motion_light app if it exists
    const appButton = page.locator('text=motion_light').first();
    if (await appButton.isVisible().catch(() => false)) {
      await appButton.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-editor-python.png'),
      clip: { x: 280, y: 0, width: 1160, height: 900 }
    });
    console.log('✓ Screenshot 3: Python editor');
    
    // Screenshot 4: YAML tab
    const yamlTab = page.locator('text=YAML').first();
    if (await yamlTab.isVisible().catch(() => false)) {
      await yamlTab.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-editor-yaml.png'),
        clip: { x: 280, y: 0, width: 1160, height: 900 }
      });
      console.log('✓ Screenshot 4: YAML editor');
    }
    
    console.log('\n✅ All screenshots saved to docs/screenshots/');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
