import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

export default function PreferencesPage({ prefs, setPrefs }) {
  const addBreak = () => {
    setPrefs({
      ...prefs,
      breaks: [...prefs.breaks, { name: '', startTime: '12:00', endTime: '13:00' }]
    });
  };

  const updateBreak = (index, field, value) => {
    const updated = [...prefs.breaks];
    updated[index][field] = value;
    setPrefs({ ...prefs, breaks: updated });
  };

  const removeBreak = (index) => {
    const updated = [...prefs.breaks];
    updated.splice(index, 1);
    setPrefs({ ...prefs, breaks: updated });
  };

  return (
    <div>
      <h1 className="mb-4">⚙️ Preferences</h1>
      
      <Card className="mb-4">
        <h3>🕒 Working Hours</h3>
        <p className="text-muted">Set your general study hours (for reference)</p>
        <Input
          label="Start Time"
          type="time"
          value={prefs.startTime}
          onChange={(e) => setPrefs({ ...prefs, startTime: e.target.value })}
        />
        <Input
          label="End Time"
          type="time"
          value={prefs.endTime}
          onChange={(e) => setPrefs({ ...prefs, endTime: e.target.value })}
        />
      </Card>

      <Card>
        <h3>🍽️ Breaks & Free Time</h3>
        <p className="text-muted">These will appear as blocked time on your schedule</p>
        
        {prefs.breaks.map((block, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <h5>Break #{index + 1}</h5>
            <Input
              label="Label"
              value={block.name}
              onChange={(e) => updateBreak(index, 'name', e.target.value)}
              placeholder="e.g., Lunch, Gym"
            />
            <div className="row">
              <div className="col-6">
                <Input
                  label="Start"
                  type="time"
                  value={block.startTime}
                  onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
                />
              </div>
              <div className="col-6">
                <Input
                  label="End"
                  type="time"
                  value={block.endTime}
                  onChange={(e) => updateBreak(index, 'endTime', e.target.value)}
                />
              </div>
            </div>
            <Button variant="danger" onClick={() => removeBreak(index)}>
              Remove Break
            </Button>
          </div>
        ))}
        
        <Button onClick={addBreak}>➕ Add Break</Button>
      </Card>
    </div>
  );
}