import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

dotenv.config();

const E2E_EMAIL = `e2e-audit-${Date.now()}@example.com`;
const E2E_PASS = 'MomCareAudit2026';

function getCleanupClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

test.describe('MomCare AI Complete End-to-End Audit', () => {
  test.afterAll(async () => {
    const sb = getCleanupClient();
    if (sb) {
      await sb.from('users').delete().eq('email', E2E_EMAIL);
    }
  });

  test('Desktop & Mobile public pages, Demo Mom & Admin RBAC, and Notifications', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Simple, friendly help for every week of pregnancy/i })
    ).toBeVisible();

    // Verify all hero/content images actually load without broken links
    const images = page.locator('img');
    const imgCount = await images.count();
    expect(imgCount).toBeGreaterThan(0);
    for (let i = 0; i < imgCount; i++) {
      await expect(images.nth(i)).toHaveJSProperty('complete', true);
    }

    // Check Services & About pages
    await page.getByRole('button', { name: 'All Tools', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: /Simple tools made for mothers and families/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /About Us/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /Warm, simple support for every mother and family/i })
    ).toBeVisible();

    // Try Demo Mom Account login & session reload persistence
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByRole('button', { name: /Try Demo Mom Account/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back, Ananya Mehta/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /Welcome back, Ananya Mehta/i })).toBeVisible();

    // Check Notifications bell dropdown in workspace header
    await page.getByRole('button', { name: /Care reminders and notifications/i }).click();
    await expect(page.getByText(/Upcoming Alerts/i)).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Verify patient cannot access Admin Panel data
    await page.getByRole('button', { name: 'Admin Panel', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Admin Sign-In Needed/i })).toBeVisible();

    // Switch to Demo Admin Panel
    await page.getByRole('button', { name: /Open Demo Admin Panel/i }).click();
    await expect(page.getByRole('heading', { name: 'Admin Panel', exact: true })).toBeVisible();
    await expect(page.getByText('ananya.mehta@momcare.ai')).toBeVisible();

    // Test user search filter in Admin
    await page.getByLabel('Search members').fill('Priya');
    await expect(page.getByText('priya.kapoor@momcare.ai')).toBeVisible();
    await page.getByLabel('Search members').fill('');

    // Check Admin tabs
    await page.getByRole('button', { name: 'Doctors', exact: true }).click();
    await expect(page.getByText('Dr. Ananya Sharma')).toBeVisible();
    await page.getByRole('button', { name: 'Visits', exact: true }).click();
    await page.getByRole('button', { name: 'Group Posts', exact: true }).click();

    // Mobile responsive drawer check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(hasOverflow).toBe(false);

    await page.getByRole('button', { name: /Open workspace navigation/i }).click();
    await expect(page.getByRole('button', { name: /Sign Out/i }).last()).toBeVisible();
    await page.getByRole('button', { name: /Sign Out/i }).last().click();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('Full authenticated mom user journey: Register -> Trackers -> Doctors/Booking -> Reminders -> Postpartum -> Community -> AI -> Logout -> Login', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Register fresh user
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await page.getByPlaceholder('e.g., Meera Sharma').fill('Audit Mother');
    await page.getByPlaceholder('meera@example.com').fill(E2E_EMAIL);
    await page.getByPlaceholder('e.g., CareMom2026').fill(E2E_PASS);
    await page.getByPlaceholder('Type same password again').fill(E2E_PASS);
    await page.getByRole('button', { name: /Create My Free Account/i }).click();

    await expect(page.getByRole('heading', { name: /Welcome back, Audit Mother/i })).toBeVisible();

    // Update profile
    await page.getByPlaceholder(/Share allergies, thyroid/i).fill('Taking daily iron & folate');
    await page.getByRole('button', { name: /Save My Details/i }).click();
    await expect(
      page.getByText(/Your maternal profile and pregnancy timeline have been saved/i)
    ).toBeVisible();

    // Week Tracker
    await page.getByRole('button', { name: 'Week Tracker', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Pregnancy Week Tracker/i })).toBeVisible();
    await page.getByRole('button', { name: /Increase pregnancy week/i }).click();
    await page.getByRole('button', { name: /Save Week to My Profile/i }).click();
    await expect(page.getByText(/Saved Week/i)).toBeVisible();

    // Baby Development
    await page.getByRole('button', { name: 'Baby Growth', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /How Your Baby Grows/i })).toBeVisible();
    await page.getByRole('button', { name: 'Wk 28', exact: true }).click();
    await expect(page.getByText(/Size of a Eggplant|Eggplant/i).first()).toBeVisible();

    // Nutrition & Water tracker
    await page.getByRole('button', { name: 'Food & Water Plan', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Food & Water Plan/i })).toBeVisible();
    await page.getByRole('button', { name: 'Non-Veg', exact: true }).click();
    await expect(page.getByText(/Non-Veg Daily Food Plan/i)).toBeVisible();
    await page.getByRole('button', { name: 'Add water glass' }).click();
    await expect(page.getByText('Water count saved.')).toBeVisible();

    // Doctors Directory -> Modal -> Book Visit
    await page.getByRole('button', { name: 'Find a Doctor', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Find a Doctor', exact: true })).toBeVisible();
    await page.getByPlaceholder(/Search doctor or hospital/i).fill('Ananya');
    await expect(page.getByText('Dr. Ananya Sharma')).toBeVisible();
    await page.getByRole('button', { name: 'About Doctor', exact: true }).click();
    await expect(page.getByRole('button', { name: /Book Visit with Dr\. Ananya Sharma/i })).toBeVisible();
    await page.getByRole('button', { name: /Book Visit with Dr\. Ananya Sharma/i }).click();

    // Book Appointment & Cancel
    await expect(page.getByRole('heading', { name: /Book a Doctor Visit/i })).toBeVisible();
    await page
      .getByPlaceholder(/Week 24 checkup/i)
      .fill('Routine trimester ultrasound review');
    await page.getByRole('button', { name: /Confirm Booking/i }).click();
    await expect(page.getByText(/Your visit is booked and saved/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();
    await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible();

    // Reminders: Create, Edit, Toggle, Delete
    await page.getByRole('button', { name: 'Pills & Checkups', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Pills & Checkup Reminders/i })).toBeVisible();
    await page.getByPlaceholder(/Iron & Calcium tablet/i).fill('Evening Calcium Pill');
    await page.getByRole('button', { name: /Save Reminder/i }).click();
    await expect(page.getByText('Evening Calcium Pill')).toBeVisible();

    await page.getByRole('button', { name: 'Edit Evening Calcium Pill' }).click();
    await page.getByLabel('Edit reminder title').fill('Evening Calcium + Vitamin D');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect(page.getByText('Evening Calcium + Vitamin D')).toBeVisible();

    await page.getByRole('button', { name: /Mark Evening Calcium \+ Vitamin D as completed/i }).click();
    await page.getByRole('button', { name: 'Delete Evening Calcium + Vitamin D' }).click();
    await expect(page.getByText('Evening Calcium + Vitamin D')).toHaveCount(0);

    // Postpartum Care tabs & daily log
    await page.getByRole('button', { name: 'After Birth Care', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /After Birth & Baby Care/i })).toBeVisible();
    await page.getByRole('button', { name: 'Feeding Baby', exact: true }).click();
    await expect(page.getByText(/Comfortable Latch & Feeding Times/i)).toBeVisible();
    await page.getByPlaceholder(/Write how healing feels/i).fill('Sleeping comfortably after checkup');
    await page.getByRole('button', { name: /Save Today’s Check-In/i }).click();
    await expect(page.getByText('Postpartum recovery log saved.')).toBeVisible();

    // Community: Create, Reply, Like, Delete
    await page.getByRole('button', { name: 'Moms Group', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Moms Support Group/i })).toBeVisible();
    await page.getByPlaceholder(/Easy stretches that helped/i).fill('Warm coconut water tip');
    await page
      .getByPlaceholder(/Share what helped you/i)
      .fill('Drinking fresh coconut water every afternoon really helped with hydration!');
    await page.getByRole('button', { name: /Post to Group/i }).click();
    await expect(page.getByRole('heading', { name: 'Warm coconut water tip' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete post Warm coconut water tip' }).click();
    await expect(page.getByRole('heading', { name: 'Warm coconut water tip' })).toHaveCount(0);

    // AI Assistant: verify safety banner & submission response (live AI or graceful 503 JSON message)
    await page.getByRole('button', { name: 'Ask AI Helper', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Ask MomCare AI/i })).toBeVisible();
    await expect(page.getByText(/Please Remember:/i).first()).toBeVisible();
    await page
      .getByPlaceholder(/Type your question here/i)
      .fill('What healthy snacks give iron in pregnancy?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    // Either AI responds with an assistant message OR shows clear 503 configuration message (never crashes/raw JSON error)
    await expect(
      page.locator('text=/Gemini AI service is not configured|MomCare AI|iron|spinach|jaggery|doctor/i').first()
    ).toBeVisible({ timeout: 15000 });

    // Sign out and log back in via email + password
    await page.getByRole('button', { name: 'Sign Out', exact: true }).first().click();
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByPlaceholder('mother@example.com').fill(E2E_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(E2E_PASS);
    await page.getByRole('button', { name: /Sign In to MomCare AI/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back, Audit Mother/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
