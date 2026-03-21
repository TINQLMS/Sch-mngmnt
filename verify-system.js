const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('Starting verification...');

        // 1. Setup
        await page.goto('file://' + process.cwd() + '/setup.html');
        await page.waitForSelector('#schoolName');
        await page.type('#schoolName', 'Test School');
        await page.type('#adminUsername', 'admin');
        await page.type('#adminPassword', 'Password123!');
        await page.click('button[type="submit"]');
        console.log('Setup completed.');

        // 2. Login
        await page.goto('file://' + process.cwd() + '/index.html');
        await page.waitForSelector('#username');
        await page.type('#username', 'admin');
        await page.type('#password', 'Password123!');
        await page.click('button[type="submit"]');
        console.log('Login attempted.');

        // Wait for redirect to portal
        await page.waitForTimeout(2000);
        console.log('Current URL:', page.url());

        // 3. Admission
        await page.goto('file://' + process.cwd() + '/admission.html');
        await page.waitForSelector('#firstName');
        await page.type('#firstName', 'John');
        await page.type('#lastName', 'Doe');
        await page.type('#admissionNo', 'ADM001');
        await page.select('#grade', 'Class 1');
        await page.click('button[type="submit"]');
        console.log('Student admitted.');

        // 4. Assessment
        await page.goto('file://' + process.cwd() + '/assessment.html');
        await page.waitForSelector('#student');
        await page.select('#student', 'ADM001');
        await page.type('#subject', 'Math');
        await page.select('#type', 'Exam');
        await page.type('#score', '85');
        await page.type('#outOf', '100');
        await page.type('#class', 'Class 1');
        await page.type('#term', 'Term 1');
        await page.click('#submitBtn');
        console.log('Assessment added.');

        // 5. Report Card
        await page.goto('file://' + process.cwd() + '/termly_report_card.html');
        await page.waitForSelector('#studentSelector');
        await page.select('#studentSelector', 'ADM001');
        await page.waitForTimeout(1000);

        const studentName = await page.$eval('#studentName', el => el.value);
        console.log('Report card for:', studentName);

        if (studentName === 'John Doe') {
            console.log('VERIFICATION SUCCESSFUL: Full student lifecycle confirmed.');
        } else {
            console.log('VERIFICATION FAILED: Student name mismatch.');
        }

        await page.screenshot({ path: 'verification-result.png', fullPage: true });

    } catch (error) {
        console.error('Verification error:', error);
        await page.screenshot({ path: 'verification-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
